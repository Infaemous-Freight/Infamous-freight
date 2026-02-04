/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: DoorDash-style Marketplace Router
 */

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { stripe } = require("../lib/stripe");
const { computePriceUsd } = require("../lib/pricing");
const { milesBetween } = require("../lib/geo");
const { validateTransition } = require("../lib/jobStateMachine");
const { authenticate, requireScope, limiters } = require("../middleware/security");
const { withIdempotency } = require("../middleware/idempotency");
const { requirePerm } = require("../auth/authorize");
const { logJobEvent } = require("./audit");
const {
    acceptJobSchema,
    addVehicleSchema,
    createJobSchema,
    holdJobSchema,
    podSubmitSchema,
    fanoutOffersSchema,
    acceptOfferSchema,
    updateDriverLocationSchema,
} = require("./validators");
const { hashOtp } = require("../lib/otp");
const { runWave, waveConfig } = require("./waves");
const { enqueueWave } = require("../queue/schedule");
const { notifier } = require("../notify/index");

const prisma = new PrismaClient();
const router = express.Router();
// Phase 14: Central state machine
const { transitionJob } = require("./state/transition");
const getTrucknEnabled =
    String(process.env.FEATURE_GET_TRUCKN ?? "true").toLowerCase() === "true";

router.use((req, res, next) => {
    if (getTrucknEnabled) return next();
    if (req.path === "/health") return next();
    return res.status(404).json({ error: "Marketplace is disabled" });
});

function centsFromPrice(priceUsd) {
    const n = Number(priceUsd);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.round(n * 100));
}

async function ensureDriverPayoutForJob({ job, driverId }) {
    if (!job || !driverId) return null;
    const amountCents = centsFromPrice(job.priceUsd);
    if (!amountCents || amountCents <= 0) return null;

    return prisma.driverPayout.upsert({
        where: { jobId: job.id },
        update: {},
        create: {
            jobId: job.id,
            driverId,
            amountCents,
            currency: "usd",
        },
    });
}

// Apply authentication to all routes except health check
router.get("/health", (_req, res) => {
    res.json({ ok: true, service: "marketplace" });
});

// Protect all other routes with authentication
router.use(authenticate);

/**
 * Health check
 */
router.get("/health", (_req, res) => {
    res.json({ ok: true, service: "marketplace" });
});

/**
 * DRIVER: Update location (for matching)
 */
router.post("/drivers/location",
    limiters.general,
    requireScope("driver:location"),
    async (req, res, next) => {
        try {
            const parsed = updateDriverLocationSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten() });
            }

            const userId = parsed.data.userId || req.user?.sub;
            const { lat, lng } = parsed.data;

            if (!userId) {
                return res.status(400).json({ error: "Missing userId" });
            }

            // Verify user matches authenticated user when provided
            if (req.user?.sub && req.user.sub !== userId) {
                return res.status(403).json({ error: "Cannot update location for another user" });
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ error: "User not found" });
            if (user.role !== "DRIVER") {
                return res.status(403).json({ error: "User is not a driver" });
            }

            const profile = await prisma.driverProfile.upsert({
                where: { userId },
                create: { userId, lastLat: lat, lastLng: lng, lastLocationAt: new Date() },
                update: { lastLat: lat, lastLng: lng, lastLocationAt: new Date() },
            });

            res.json({ ok: true, profile });
        } catch (err) {
            next(err);
        }
    });

/**
 * DRIVER: Stripe Connect onboarding (Express)
 */
router.post("/connect/create",
    limiters.general,
    requireScope("driver:view"),
    async (req, res, next) => {
        try {
            const userId = req.user?.sub;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { driverProfile: true },
            });
            if (!user) return res.status(404).json({ error: "User not found" });
            if (user.role !== "DRIVER") {
                return res.status(403).json({ error: "User is not a driver" });
            }

            let accountId = user.driverProfile?.stripeAccountId;
            if (!accountId) {
                const acct = await stripe.accounts.create({
                    type: "express",
                    capabilities: { transfers: { requested: true } },
                });
                accountId = acct.id;

                await prisma.driverProfile.upsert({
                    where: { userId },
                    create: { userId, stripeAccountId: accountId },
                    update: { stripeAccountId: accountId },
                });
            }

            const link = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: process.env.STRIPE_CONNECT_REFRESH_URL,
                return_url: process.env.STRIPE_CONNECT_RETURN_URL,
                type: "account_onboarding",
            });

            res.json({ ok: true, url: link.url, stripeAccountId: accountId });
        } catch (err) {
            next(err);
        }
    });

router.get("/connect/status",
    limiters.general,
    requireScope("driver:view"),
    async (req, res, next) => {
        try {
            const userId = req.user?.sub;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { driverProfile: true },
            });
            if (!user?.driverProfile?.stripeAccountId) {
                return res.status(404).json({ error: "No Stripe account" });
            }

            const acct = await stripe.accounts.retrieve(user.driverProfile.stripeAccountId);
            const onboarded = !!acct.details_submitted && acct.charges_enabled && acct.payouts_enabled;

            await prisma.driverProfile.update({
                where: { userId },
                data: { stripeOnboarded: onboarded },
            });

            res.json({
                ok: true,
                onboarded,
                details_submitted: acct.details_submitted,
                payouts_enabled: acct.payouts_enabled,
            });
        } catch (err) {
            next(err);
        }
    });

/**
 * DRIVER: Add vehicle to profile
 */
router.post("/drivers/vehicles",
    limiters.general,
    requireScope("driver:vehicle"),
    async (req, res, next) => {
        try {
            const parsed = addVehicleSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten() });
            }

            const { userId, type, nickname, maxWeightLbs, maxVolumeCuFt } = parsed.data;

            // Verify user matches authenticated user
            if (req.user?.sub !== userId) {
                return res.status(403).json({ error: "Cannot add vehicle for another user" });
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ error: "User not found" });
            if (user.role !== "DRIVER") {
                return res.status(403).json({ error: "User is not a driver" });
            }

            const profile = await prisma.driverProfile.upsert({
                where: { userId },
                create: { userId },
                update: {},
            });

            const vehicle = await prisma.vehicle.create({
                data: { driverId: profile.id, type, nickname, maxWeightLbs, maxVolumeCuFt },
            });

            res.json({ ok: true, vehicle });
        } catch (err) {
            next(err);
        }
    });

/**
 * SHIPPER: Create job with quote
 * DRAFT -> REQUIRES_PAYMENT (then Stripe Checkout -> webhook -> OPEN)
 */
router.post("/jobs",
    limiters.general,
    requireScope("shipper:create"),
    async (req, res, next) => {
        try {
            const parsed = createJobSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten() });
            }

            const data = parsed.data;

            // Verify user matches authenticated user
            if (req.user?.sub !== data.shipperId) {
                return res.status(403).json({ error: "Cannot create job for another user" });
            }

            const shipper = await prisma.user.findUnique({ where: { id: data.shipperId } });
            if (!shipper) return res.status(404).json({ error: "Shipper not found" });
            if (shipper.role !== "SHIPPER" && shipper.role !== "ADMIN") {
                return res.status(403).json({ error: "User is not a shipper" });
            }

            // Ensure Stripe customer exists for faster checkout
            let stripeCustomerId = shipper.stripeCustomerId;
            if (!stripeCustomerId) {
                const customer = await stripe.customers.create({
                    email: shipper.email,
                    name: shipper.name ?? undefined,
                    metadata: { userId: shipper.id },
                });
                stripeCustomerId = customer.id;

                await prisma.user.update({
                    where: { id: shipper.id },
                    data: { stripeCustomerId: customer.id },
                });
            }

            const priceUsd = computePriceUsd({
                estimatedMiles: data.estimatedMiles,
                estimatedMinutes: data.estimatedMinutes,
                shipperPlanTier: shipper.planTier,
            });

            const job = await prisma.job.create({
                data: {
                    shipperId: data.shipperId,
                    status: "REQUIRES_PAYMENT",

                    pickupAddress: data.pickupAddress,
                    pickupLat: data.pickupLat,
                    pickupLng: data.pickupLng,

                    dropoffAddress: data.dropoffAddress,
                    dropoffLat: data.dropoffLat,
                    dropoffLng: data.dropoffLng,

                    requiredVehicle: data.requiredVehicle,
                    weightLbs: data.weightLbs,
                    volumeCuFt: data.volumeCuFt,
                    notes: data.notes,

                    estimatedMiles: data.estimatedMiles,
                    estimatedMinutes: data.estimatedMinutes,
                    priceUsd: priceUsd,

                    payment: {
                        create: {
                            userId: data.shipperId,
                            status: "INITIATED",
                            amountUsd: priceUsd,
                        },
                    },
                },
                include: { payment: true },
            });

            // Log job creation and payment initiation
            await logJobEvent({
                jobId: job.id,
                type: "CREATED",
                actorUserId: shipper.id,
                message: `Job created: ${job.pickupAddress} -> ${job.dropoffAddress} (${job.requiredVehicle})`,
            });

            await logJobEvent({
                jobId: job.id,
                type: "PAYMENT_INITIATED",
                actorUserId: shipper.id,
                message: `Payment required: $${job.priceUsd}`,
            });

            res.json({ ok: true, job });
        } catch (err) {
            next(err);
        }
    });

/**
 * SHIPPER: Pay-per-delivery checkout
 */
router.post("/jobs/:jobId/checkout",
    limiters.billing,
    requireScope("shipper:checkout"),
    async (req, res, next) => {
        try {
            const { jobId } = req.params;

            const job = await prisma.job.findUnique({
                where: { id: jobId },
                include: { payment: true, shipper: true },
            });

            if (!job) return res.status(404).json({ error: "Job not found" });

            // Verify user owns this job
            if (req.user?.sub !== job.shipperId) {
                return res.status(403).json({ error: "Cannot checkout job for another user" });
            }

            if (job.status !== "REQUIRES_PAYMENT") {
                return res.status(400).json({ error: `Job not in REQUIRES_PAYMENT (is ${job.status})` });
            }
            if (!job.payment) return res.status(500).json({ error: "Payment record missing" });

            // Verify price hasn't changed
            const currentPrice = computePriceUsd({
                estimatedMiles: job.estimatedMiles,
                estimatedMinutes: job.estimatedMinutes,
                shipperPlanTier: job.shipper.planTier,
            });

            if (Math.abs(currentPrice - Number(job.priceUsd)) > 0.01) {
                return res.status(400).json({
                    error: "Price has changed since job creation",
                    oldPrice: Number(job.priceUsd),
                    newPrice: currentPrice,
                    message: "Please create a new job with updated pricing"
                });
            }

            const publicUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";

            // Use idempotency key to prevent duplicate charges
            const idempotencyKey = req.headers['idempotency-key'] || `job-checkout-${jobId}-${Date.now()}`;

            const session = await stripe.checkout.sessions.create({
                mode: "payment",
                payment_method_types: ["card"],
                customer: job.shipper.stripeCustomerId ?? undefined,
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            unit_amount: Math.round(Number(job.priceUsd) * 100),
                            product_data: {
                                name: "Infæmous Freight Delivery",
                                description: `Job ${job.id} — ${job.requiredVehicle} — ${job.estimatedMiles} mi`,
                            },
                        },
                        quantity: 1,
                    },
                ],
                success_url: `${publicUrl}/payment/success?jobId=${job.id}`,
                cancel_url: `${publicUrl}/payment/cancel?jobId=${job.id}`,
                metadata: {
                    kind: "job_payment",
                    jobId: job.id,
                    paymentId: job.payment.id,
                    shipperId: job.shipperId,
                },
            }, {
                idempotencyKey: idempotencyKey,
            });

            // Update payment record with session ID
            await prisma.jobPayment.update({
                where: { id: job.payment.id },
                data: { stripeCheckoutId: session.id },
            });

            // Log checkout session creation
            await logJobEvent({
                jobId: job.id,
                type: "PAYMENT_INITIATED",
                actorUserId: job.shipperId,
                message: `Stripe Checkout session created: ${session.id}`,
            });

            res.json({ ok: true, checkoutUrl: session.url, sessionId: session.id });
        } catch (err) {
            next(err);
        }
    });

/**
 * DRIVER: List jobs (optionally filtered by location)
 * If lat/lng present, returns jobs within radius
 */
router.get("/jobs",
    limiters.general,
    requireScope("driver:view"),
    async (req, res, next) => {
        try {
            const status = (req.query.status || "OPEN");
            const lat = req.query.lat ? Number(req.query.lat) : undefined;
            const lng = req.query.lng ? Number(req.query.lng) : undefined;

            // Pagination
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(parseInt(req.query.limit) || 20, 100);
            const skip = (page - 1) * limit;

            const radius = Number(process.env.MATCH_RADIUS_MILES || "10");

            const [jobs, total] = await Promise.all([
                prisma.job.findMany({
                    where: { status: status },
                    orderBy: { createdAt: "desc" },
                    take: limit,
                    skip: skip,
                }),
                prisma.job.count({ where: { status: status } })
            ]);

            if (lat == null || lng == null) {
                return res.json({
                    ok: true,
                    jobs,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                });
            }

            const filtered = jobs
                .map((j) => ({
                    job: j,
                    milesAway: milesBetween(lat, lng, j.pickupLat, j.pickupLng),
                }))
                .filter((x) => x.milesAway <= radius)
                .sort((a, b) => a.milesAway - b.milesAway);

            res.json({
                ok: true,
                jobs: filtered,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (err) {
            next(err);
        }
    });

/**
 * Matching: Eligible drivers near pickup with correct vehicle + capacity
 */
router.get("/jobs/:jobId/match", async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const radius = Number(process.env.MATCH_RADIUS_MILES || "10");

        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) return res.status(404).json({ error: "Job not found" });

        const drivers = await prisma.driverProfile.findMany({
            where: { isActive: true, lastLat: { not: null }, lastLng: { not: null } },
            include: { user: true, vehicles: true },
            take: 500,
        });

        const eligible = drivers
            .map((d) => {
                const milesAway = milesBetween(d.lastLat ?? 0, d.lastLng ?? 0, job.pickupLat, job.pickupLng);

                const canHandle = d.vehicles.some(
                    (v) =>
                        v.type === job.requiredVehicle &&
                        v.maxWeightLbs >= job.weightLbs &&
                        v.maxVolumeCuFt >= job.volumeCuFt
                );

                return { driver: d, milesAway, canHandle };
            })
            .filter((x) => x.canHandle && x.milesAway <= radius)
            .sort((a, b) => a.milesAway - b.milesAway)
            .slice(0, 25);

        res.json({ ok: true, jobId, eligible });
    } catch (err) {
        next(err);
    }
});

/**
 * DRIVER: Hold a paid job for a short window (race-safe)
 */
router.post("/jobs/:jobId/hold",
    limiters.general,
    requireScope("driver:accept"),
    async (req, res, next) => {
        try {
            const jobId = req.params.jobId;
            const parsed = holdJobSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten() });
            }

            const driverUserId = parsed.data.driverUserId;
            if (!req.user?.sub || req.user.sub !== driverUserId) {
                return res.status(403).json({ error: "Cannot hold for another user" });
            }

            const holdSeconds = Number(process.env.JOB_HOLD_SECONDS || "90");
            const heldUntil = new Date(Date.now() + holdSeconds * 1000);
            const now = new Date();
            const holdRadiusMiles = Number(process.env.HOLD_RADIUS_MILES || process.env.MATCH_RADIUS_MILES || "10");

            // Fetch eligibility context outside transition
            const job = await prisma.job.findUnique({ where: { id: jobId }, include: { payment: true } });
            if (!job) throw new Error("Job not found");
            if (job.status !== "OPEN") throw new Error(`Job not OPEN (is ${job.status})`);
            if (!job.payment || job.payment.status !== "SUCCEEDED") throw new Error("Job not paid");
            if (job.driverId) throw new Error("Job already assigned");

            const driver = await prisma.user.findUnique({
                where: { id: driverUserId },
                include: { driverProfile: true, vehicles: true },
            });
            if (!driver) throw new Error("Driver not found");
            if (driver.role !== "DRIVER") throw new Error("User is not a driver");
            if (!driver.driverProfile?.isActive) throw new Error("Driver not active");
            if (driver.driverProfile.lastLat == null || driver.driverProfile.lastLng == null) {
                throw new Error("Driver location missing");
            }

            const distance = milesBetween(
                driver.driverProfile.lastLat,
                driver.driverProfile.lastLng,
                job.pickupLat,
                job.pickupLng,
            );
            if (distance > holdRadiusMiles) throw new Error("Driver too far to hold");

            const okVehicle = (driver.vehicles || []).some((v) =>
                v.type === job.requiredVehicle &&
                v.maxWeightLbs >= job.weightLbs &&
                v.maxVolumeCuFt >= job.volumeCuFt
            );
            if (!okVehicle) throw new Error("Driver not eligible for this job");

            // Centralized transition for race-safe hold
            await transitionJob({
                jobId,
                to: "HELD",
                actor: { userId: driverUserId, role: "DRIVER" },
                reason: `Job held for ${holdSeconds}s`,
                data: { heldByDriverId: driverUserId, heldUntil },
            });

            const result = await prisma.job.findUnique({ where: { id: jobId } });

            res.json({ ok: true, job: result });
        } catch (e) {
            res.status(400).json({ error: e.message || "Hold failed" });
        }
    });

/**
 * Fanout offers via wave 1 kickoff
 */
router.post("/jobs/:jobId/offers/fanout",
    limiters.general,
    requireScope("shipper:create"),
    async (req, res, next) => {
        try {
            const jobId = req.params.jobId;
            const parsed = fanoutOffersSchema.safeParse(req.body ?? {});
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten() });
            }

            const shipperId = req.user?.sub;
            const job = await prisma.job.findUnique({ where: { id: jobId }, include: { payment: true } });
            if (!job) return res.status(404).json({ error: "Job not found" });
            if (job.shipperId !== shipperId) {
                return res.status(403).json({ error: "Not authorized for this job" });
            }
            if (!job.payment || job.payment.status !== "SUCCEEDED") {
                return res.status(400).json({ error: "Job payment not confirmed" });
            }
            if (job.driverId) {
                return res.status(400).json({ error: "Job already assigned" });
            }
            if (job.status !== "OPEN") {
                return res.status(400).json({ error: `Job not open (is ${job.status})` });
            }
            if (job.offerWave && job.offerWave >= 1) {
                return res.status(400).json({ error: "Wave already started" });
            }

            // Phase 15: enqueue wave processing to worker
            const { enqueueWave } = require("../queue/schedule");
            await enqueueWave(jobId, 1, 0);

            res.json({ ok: true, wave: 1, scheduled: true });
        } catch (err) {
            next(err);
        }
    });

/**
 * Advance offer waves when due
 */
// Phase 15: tick disabled in favor of automatic scheduling
router.post("/jobs/:jobId/offers/tick",
    limiters.general,
    requireScope("shipper:create"),
    async (req, res) => {
        res.status(400).json({ error: "Automatic waves enabled; tick endpoint disabled" });
    });

/**
 * DRIVER: List active offers
 */
router.get("/offers",
    limiters.general,
    requireScope("driver:view"),
    async (req, res, next) => {
        try {
            const userId = req.user?.sub;
            if (!userId) return res.status(401).json({ error: "Not authenticated" });

            const now = new Date();
            await prisma.jobOffer.updateMany({
                where: { driverId: userId, status: "OFFERED", expiresAt: { lt: now } },
                data: { status: "EXPIRED" },
            });

            const offers = await prisma.jobOffer.findMany({
                where: { driverId: userId, status: "OFFERED", expiresAt: { gt: now } },
                include: {
                    job: true,
                },
                orderBy: { expiresAt: "asc" },
                take: 100,
            });

            res.json({ ok: true, offers });
        } catch (err) {
            next(err);
        }
    });

/**
 * DRIVER: Accept paid OPEN job (race-safe first-wins)
 * Phase 4: Multiple drivers can attempt simultaneously; exactly one wins
 */
router.post("/jobs/:jobId/accept",
    limiters.general,
    requireScope("driver:accept"),
    requirePerm("job:accept"),
    withIdempotency({ scope: "marketplace:jobs:accept" }),
    async (req, res, next) => {
        try {
            const { jobId } = req.params;
            const driverUserId = req.user?.sub;
            const now = new Date();

            if (!driverUserId) {
                return res.status(401).json({ error: "Not authenticated" });
            }

            // Fetch job for eligibility checks
            const job = await prisma.job.findUnique({
                where: { id: jobId },
                include: { payment: true },
            });
            if (!job) throw new Error("Job not found");
            if (!job.payment || job.payment.status !== "SUCCEEDED") throw new Error("Job payment not confirmed");

            const driver = await prisma.user.findUnique({
                where: { id: driverUserId },
                include: { driverProfile: true, vehicles: true },
            });
            if (!driver) throw new Error("Driver not found");
            if (driver.role !== "DRIVER") throw new Error("User is not a driver");
            if (!driver.driverProfile?.isActive) throw new Error("Driver is not active");
            if (!driver.driverProfile?.lastLat || !driver.driverProfile?.lastLng) {
                throw new Error("Driver location not available");
            }

            const hasCompatibleVehicle = (driver.vehicles || []).some(v =>
                v.type === job.requiredVehicle && v.maxWeightLbs >= job.weightLbs && v.maxVolumeCuFt >= job.volumeCuFt
            );
            if (!hasCompatibleVehicle) throw new Error("No compatible vehicle available");

            await transitionJob({ jobId, to: "ACCEPTED", actor: { userId: driverUserId, role: "DRIVER" }, reason: "Driver accepted job" });

            await prisma.jobOffer.updateMany({ where: { jobId, status: "OFFERED" }, data: { status: "EXPIRED" } });

            const result = await prisma.job.findUnique({
                where: { id: jobId },
                include: {
                    shipper: { select: { id: true, email: true, name: true } },
                    driver: { select: { id: true, email: true, name: true } },
                    payment: true,
                    events: { orderBy: { createdAt: "asc" } },
                },
            });

            res.json({ ok: true, job: result });
        } catch (err) {
            next(err);
        }
    });

/**
 * Accept a specific offer (race-safe, honors holds)
 */
router.post("/offers/:offerId/accept",
    limiters.general,
    requireScope("driver:accept"),
    requirePerm("offer:accept"),
    withIdempotency({ scope: "marketplace:offers:accept" }),
    async (req, res, next) => {
        try {
            const offerId = req.params.offerId;
            const driverUserId = req.user?.sub;
            const now = new Date();

            if (!driverUserId) {
                return res.status(401).json({ error: "Not authenticated" });
            }

            const offer = await prisma.jobOffer.findUnique({
                where: { id: offerId },
                include: { job: { include: { payment: true } } },
            });

            if (!offer) throw new Error("Offer not found");
            if (offer.driverId !== driverUserId) throw new Error("Not authorized for this offer");

            if (offer.status !== "OFFERED" || offer.expiresAt < now) {
                await prisma.jobOffer.update({ where: { id: offerId }, data: { status: "EXPIRED" } });
                throw new Error("Offer expired");
            }

            const job = offer.job;

            // Expire stale holds
            if (job.status === "HELD" && job.heldUntil && job.heldUntil < now) {
                await tx.job.update({
                    where: { id: job.id },
                    data: { status: "OPEN", heldByDriverId: null, heldUntil: null },
                });

                await tx.jobEvent.create({
                    data: {
                        jobId: job.id,
                        type: "NOTE",
                        actorUserId: null,
                        message: "Hold expired; job reopened",
                    },
                });

                job = { ...job, status: "OPEN", heldByDriverId: null, heldUntil: null };
            }

            if (job.status !== "OPEN" && job.status !== "HELD") {
                throw new Error(`Job not available (status: ${job.status})`);
            }
            if (job.status === "HELD" && job.heldByDriverId && job.heldByDriverId !== driverUserId) {
                throw new Error("Job held by another driver");
            }
            if (job.driverId) {
                throw new Error("Job already accepted");
            }
            if (!job.payment || job.payment.status !== "SUCCEEDED") {
                throw new Error("Job payment not confirmed");
            }

            const driver = await tx.user.findUnique({
                where: { id: driverUserId },
                include: { driverProfile: true, vehicles: true },
            });

            if (!driver) throw new Error("Driver not found");
            if (driver.role !== "DRIVER") throw new Error("User is not a driver");
            if (!driver.driverProfile?.isActive) throw new Error("Driver is not active");
            if (!driver.driverProfile?.lastLat || !driver.driverProfile?.lastLng) {
                throw new Error("Driver location not available");
            }

            const hasCompatibleVehicle = (driver.vehicles || []).some(v =>
                v.type === job.requiredVehicle &&
                v.maxWeightLbs >= job.weightLbs &&
                v.maxVolumeCuFt >= job.volumeCuFt
            );

            if (!hasCompatibleVehicle) {
                throw new Error("No compatible vehicle available");
            }

            await transitionJob({ jobId: job.id, to: "ACCEPTED", actor: { userId: driverUserId, role: "DRIVER" }, reason: "Driver accepted job via offer" });

            await prisma.jobOffer.update({ where: { id: offerId }, data: { status: "ACCEPTED", acceptedAt: now } });

            await prisma.jobOffer.updateMany({ where: { jobId: job.id, status: "OFFERED", id: { not: offerId } }, data: { status: "EXPIRED" } });

            const result = await prisma.job.findUnique({
                where: { id: job.id },
                include: {
                    shipper: { select: { id: true, email: true, name: true } },
                    driver: { select: { id: true, email: true, name: true } },
                    payment: true,
                    events: { orderBy: { createdAt: "asc" } },
                },
            });

            res.json({ ok: true, job: result });
        } catch (err) {
            next(err);
        }
    });

/**
 * Submit Proof of Delivery (Phase 8 MVP)
 */
router.post("/jobs/:jobId/pod",
    limiters.general,
    requireScope("driver:deliver"),
    requirePerm("job:deliver"),
    withIdempotency({ scope: "marketplace:jobs:pod" }),
    async (req, res, next) => {
        try {
            const jobId = req.params.jobId;
            const parsed = podSubmitSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten() });
            }

            const { driverUserId, otp, signatureName, signatureKey, photoKey, notes } = parsed.data;

            if (!req.user?.sub || req.user.sub !== driverUserId) {
                return res.status(403).json({ error: "Not authorized: driver mismatch" });
            }

            const job = await prisma.job.findUnique({ where: { id: jobId } });
            if (!job) throw new Error("Job not found");
            if (!job.driverId || job.driverId !== driverUserId) throw new Error("Not authorized: driver not assigned");
            if (!["ACCEPTED", "PICKED_UP"].includes(job.status)) throw new Error(`Job not deliverable (is ${job.status})`);

            // Enforce OTP based on pod policy (hash verification retained)
            if (job.podRequireOtp) {
                if (!otp) throw new Error("OTP required");
                const ok = job.deliveryOtpHash && hashOtp(otp) === job.deliveryOtpHash;
                if (!ok) throw new Error("Invalid OTP");
            }

            // Perform centralized transition
            const deliveredAt = new Date();
            await transitionJob({
                jobId,
                to: "DELIVERED",
                actor: { userId: driverUserId, role: "DRIVER" },
                reason: "Proof of delivery submitted",
                data: { deliveredAt },
            });

            const payout = await ensureDriverPayoutForJob({ job, driverId: driverUserId });

            // Add policy enforcement note
            const podNoteParts = [
                job.podRequireOtp ? "OTP validated" : "OTP not required",
                job.podRequireSignature && signatureName ? `Signature: ${signatureName}` : null,
                job.podRequireSignature && signatureKey ? `Signature key: ${signatureKey}` : null,
                job.podRequirePhoto && photoKey ? `Photo key: ${photoKey}` : null,
                notes ? `Notes: ${notes}` : null,
            ].filter(Boolean);

            await prisma.jobEvent.create({
                data: {
                    jobId,
                    type: "NOTE",
                    actorUserId: driverUserId,
                    message: `POD policy enforced v${job.podPolicyVersion}: ${podNoteParts.join(" | ")}`,
                },
            });

            const result = await prisma.job.findUnique({ where: { id: jobId } });

            res.json({ ok: true, job: result, payout });
        } catch (err) {
            next(err);
        }
    });

/**
 * DRIVER: Mark delivered (MVP)
 */
router.post("/jobs/:jobId/deliver",
    limiters.general,
    requireScope("driver:deliver"),
    requirePerm("job:deliver"),
    async (req, res, next) => {
        try {
            const { jobId } = req.params;

            const job = await prisma.job.findUnique({ where: { id: jobId } });
            if (!job) return res.status(404).json({ error: "Job not found" });

            // Verify user is the assigned driver
            if (req.user?.sub !== job.driverId) {
                return res.status(403).json({ error: "Only assigned driver can mark delivery" });
            }

            if (job.status !== "ACCEPTED" && job.status !== "PICKED_UP") {
                return res.status(400).json({ error: `Job not in ACCEPTED/PICKED_UP (is ${job.status})` });
            }

            await transitionJob({ jobId, to: "DELIVERED", actor: { userId: req.user?.sub || null, role: "DRIVER" }, reason: "Driver marked delivered" });

            const updated = await prisma.job.findUnique({ where: { id: jobId } });
            const payout = await ensureDriverPayoutForJob({ job: updated, driverId: req.user?.sub });
            res.json({ ok: true, job: updated, payout });
        } catch (err) {
            next(err);
        }
    });

/**
 * DRIVER: Pay out a pending driver payout via Stripe Connect transfer
 */
router.post("/payouts/:payoutId/pay",
    limiters.billing,
    requireScope("driver:view"),
    async (req, res, next) => {
        try {
            const payoutId = req.params.payoutId;
            const userId = req.user?.sub;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { driverProfile: true },
            });
            if (!user?.driverProfile?.stripeAccountId) {
                return res.status(400).json({ error: "Stripe Connect not set up" });
            }

            const payout = await prisma.driverPayout.findUnique({ where: { id: payoutId } });
            if (!payout || payout.driverId !== userId) {
                return res.status(403).json({ error: "Not your payout" });
            }
            if (payout.status !== "PENDING") {
                return res.status(409).json({ error: "Payout not pending" });
            }

            const transfer = await stripe.transfers.create({
                amount: payout.amountCents,
                currency: payout.currency || "usd",
                destination: user.driverProfile.stripeAccountId,
                metadata: { payoutId },
            });

            const updated = await prisma.driverPayout.update({
                where: { id: payoutId },
                data: {
                    status: "PAID",
                    stripeTransferId: transfer.id,
                    paidAt: new Date(),
                },
            });

            res.json({ ok: true, payout: updated, transferId: transfer.id });
        } catch (err) {
            next(err);
        }
    });

/**
 * GET /jobs/:jobId/timeline
 * Retrieve full job details with all audit events
 * Scopes: user:view, driver:view, shipper:view
 */
router.get("/jobs/:jobId/timeline",
    limiters.general,
    async (req, res, next) => {
        try {
            const { jobId } = req.params;
            const userId = req.user?.sub;

            // Fetch job with full details
            const job = await prisma.job.findUnique({
                where: { id: jobId },
                include: {
                    shipper: { select: { id: true, email: true, name: true } },
                    driver: { select: { id: true, email: true, name: true } },
                    payment: true,
                    events: {
                        orderBy: { createdAt: "asc" },
                    },
                },
            });

            if (!job) {
                return res.status(404).json({ error: "Job not found" });
            }

            // Authorization: shipper can see own jobs, driver can see assigned jobs, admin can see all
            const isShipper = userId === job.shipperId;
            const isDriver = userId === job.driverId;
            const isAdmin = req.user?.role === "admin";

            if (!isShipper && !isDriver && !isAdmin) {
                return res.status(403).json({ error: "You do not have access to this job timeline" });
            }

            res.json({
                ok: true,
                job: {
                    id: job.id,
                    status: job.status,
                    shipper: job.shipper,
                    driver: job.driver,
                    pickupAddress: job.pickupAddress,
                    dropoffAddress: job.dropoffAddress,
                    priceUsd: job.priceUsd,
                    createdAt: job.createdAt,
                    updatedAt: job.updatedAt,
                    payment: job.payment,
                },
                timeline: job.events,
            });
        } catch (err) {
            next(err);
        }
    });

/**
 * DRIVER: List my assigned jobs
 * GET /marketplace/drivers/:driverUserId/jobs
 */
router.get("/drivers/:driverUserId/jobs",
    limiters.general,
    async (req, res, next) => {
        try {
            const { driverUserId } = req.params;
            const userId = req.user?.sub;

            // Authorization: drivers can only see their own jobs
            if (userId !== driverUserId && req.user?.role !== "admin") {
                return res.status(403).json({ error: "Cannot view another driver's jobs" });
            }

            const jobs = await prisma.job.findMany({
                where: { driverId: driverUserId },
                include: {
                    shipper: { select: { id: true, email: true, name: true } },
                    payment: true,
                },
                orderBy: { updatedAt: "desc" },
                take: 100,
            });

            res.json({
                ok: true,
                count: jobs.length,
                jobs,
            });
        } catch (err) {
            next(err);
        }
    });

module.exports = router;
