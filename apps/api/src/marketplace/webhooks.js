/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Stripe Webhook Handler
 */

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { stripe } = require("../lib/stripe");
const { logger } = require("../middleware/logger");
const { v4: uuidv4 } = require("uuid");
const { validateTransition } = require("../lib/jobStateMachine");
const { logJobEvent } = require("./audit");
const { generateOtp, hashOtp } = require("../lib/otp");
const { computePodPolicy } = require("./podPolicy");

const prisma = new PrismaClient();
const router = express.Router();

// In-memory deduplication cache (use Redis in production)
const processedEvents = new Set();

// Cleanup old events every hour
setInterval(() => {
    if (processedEvents.size > 10000) {
        processedEvents.clear();
        logger.info("Cleared webhook deduplication cache");
    }
}, 60 * 60 * 1000);

/**
 * Stripe webhook endpoint
 * Handles payment confirmations and subscription events
 */
router.post(
    "/stripe",
    express.raw({ type: "application/json" }),
    async (req, res, next) => {
        // Generate correlation ID for tracking
        const correlationId = req.headers['x-correlation-id'] || uuidv4();
        req.correlationId = correlationId;

        try {
            const sig = req.headers["stripe-signature"];
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

            if (!webhookSecret) {
                logger.warn("STRIPE_WEBHOOK_SECRET not configured", { correlationId });
                return res.status(500).json({ error: "Webhook secret not configured" });
            }

            let event;
            try {
                event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
            } catch (err) {
                logger.error("Webhook signature verification failed", {
                    error: err.message,
                    correlationId
                });
                return res.status(400).json({ error: `Webhook Error: ${err.message}` });
            }

            // Check for duplicate events
            if (processedEvents.has(event.id)) {
                logger.info("Duplicate webhook event ignored", {
                    eventId: event.id,
                    type: event.type,
                    correlationId
                });
                return res.json({ received: true, duplicate: true });
            }

            // Mark as processed
            processedEvents.add(event.id);
            setTimeout(() => processedEvents.delete(event.id), 24 * 60 * 60 * 1000);

            logger.info("Stripe webhook received", {
                type: event.type,
                id: event.id,
                correlationId
            });

            // Capture metadata for auditability
            const stripeObjId = event?.data?.object?.id ? String(event.data.object.id) : null;
            let jobIdFromMeta = null;
            if (event.type === "checkout.session.completed" || event.type === "checkout.session.expired") {
                const session = event.data.object;
                jobIdFromMeta = session?.metadata?.jobId ? String(session.metadata.jobId) : null;
            }

            // Store webhook event with metadata
            await prisma.webhookEvent.create({
                data: {
                    id: event.id,
                    type: event.type,
                    jobId: jobIdFromMeta,
                    stripeObjId: stripeObjId,
                },
            });

            // Handle the event
            switch (event.type) {
                case "checkout.session.completed":
                    await handleCheckoutCompleted(event.data.object, correlationId);
                    break;

                case "checkout.session.expired":
                    await handleCheckoutExpired(event.data.object, correlationId);
                    break;

                case "customer.subscription.created":
                case "customer.subscription.updated":
                    await handleSubscriptionUpdated(event.data.object, correlationId);
                    break;

                case "customer.subscription.deleted":
                    await handleSubscriptionDeleted(event.data.object, correlationId);
                    break;

                case "invoice.payment_succeeded":
                    await handleInvoicePaymentSucceeded(event.data.object, correlationId);
                    break;

                case "invoice.payment_failed":
                    await handleInvoicePaymentFailed(event.data.object, correlationId);
                    break;

                default:
                    logger.info("Unhandled webhook event type", {
                        type: event.type,
                        correlationId
                    });
            }

            res.json({ received: true, correlationId });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry(fn, maxRetries = 3, operation = "operation") {
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            attempt++;
            if (attempt === maxRetries) {
                logger.error(`${operation} failed after ${maxRetries} attempts`, {
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }

            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
            logger.warn(`${operation} failed, retrying in ${delay}ms`, {
                attempt,
                error: error.message
            });

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function fetchLatestChargeId(paymentIntentId, correlationId) {
    try {
        if (!paymentIntentId) return null;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ["latest_charge"],
        });

        const expandedCharge = paymentIntent.latest_charge;
        if (expandedCharge) {
            return typeof expandedCharge === "string" ? expandedCharge : expandedCharge.id;
        }

        if (paymentIntent.charges?.data?.length) {
            return paymentIntent.charges.data[0]?.id ?? null;
        }

        return null;
    } catch (error) {
        logger.warn("Unable to fetch latest charge for payment intent", {
            paymentIntentId,
            error: error.message,
            correlationId,
        });
        return null;
    }
}

/**
 * Handle checkout.session.completed
 * - Job payment: mark payment SUCCEEDED, job status OPEN
 * - Subscription: already handled by subscription.created
 */
async function handleCheckoutCompleted(session, correlationId) {
    const { metadata } = session;

    if (metadata?.kind === "job_payment") {
        const { jobId, paymentId } = metadata;

        logger.info("Processing job payment", {
            jobId,
            paymentId,
            correlationId
        });

        const otpRequiredDefault = ["1", "true", "yes", "on"].includes(
            String(process.env.OTP_REQUIRED_DEFAULT ?? "true").toLowerCase()
        );

        let otpPlain = null;
        let otpHash = null;
        if (otpRequiredDefault) {
            otpPlain = generateOtp();
            otpHash = hashOtp(otpPlain);
        }

        await withRetry(async () => {
            const stripeChargeId = await fetchLatestChargeId(session.payment_intent, correlationId);

            await prisma.$transaction(async (tx) => {
                // Update payment status
                await tx.jobPayment.update({
                    where: { id: paymentId },
                    data: {
                        status: "SUCCEEDED",
                        stripePaymentId: session.payment_intent,
                        stripeChargeId,
                    },
                });

                // Get current job to validate transition
                const job = await tx.job.findUnique({ where: { id: jobId } });
                if (!job) {
                    throw new Error(`Job ${jobId} not found`);
                }

                // Validate state transition
                validateTransition(job.status, "OPEN");

                // Compute POD policy before opening job
                const priceUsd = Number(job.priceUsd);
                const policy = computePodPolicy({ priceUsd, requiredVehicle: job.requiredVehicle });

                // Update job status to OPEN with policy fields
                await tx.job.update({
                    where: { id: jobId },
                    data: {
                        status: "OPEN",
                        // Policy flags from Phase 12
                        podRequirePhoto: policy.requirePhoto,
                        podRequireSignature: policy.requireSignature,
                        podRequireOtp: policy.requireOtp,
                        podPolicyVersion: policy.version,
                        // Keep OTP consistent with policy
                        otpRequired: policy.requireOtp,
                        deliveryOtpHash: policy.requireOtp ? otpHash : null,
                    },
                });

                // Log payment succeeded
                await tx.jobEvent.create({
                    data: {
                        jobId,
                        type: "PAYMENT_SUCCEEDED",
                        actorUserId: job.shipperId,
                        message: `Stripe payment succeeded. PI: ${session.payment_intent ?? "n/a"}${stripeChargeId ? ` Charge: ${stripeChargeId}` : ""}`,
                    },
                });

                // Log job opened
                await tx.jobEvent.create({
                    data: {
                        jobId,
                        type: "OPENED",
                        actorUserId: job.shipperId,
                        message: "Job opened for driver matching",
                    },
                });

                // Log POD policy decision
                await tx.jobEvent.create({
                    data: {
                        jobId,
                        type: "NOTE",
                        actorUserId: job.shipperId,
                        message: `POD policy v${policy.version}: photo=${policy.requirePhoto} signature=${policy.requireSignature} otp=${policy.requireOtp}`,
                    },
                });

                // Log OTP if required by policy
                if (policy.requireOtp && otpPlain) {
                    await tx.jobEvent.create({
                        data: {
                            jobId,
                            type: "NOTE",
                            actorUserId: job.shipperId,
                            message: `Delivery OTP generated (share with recipient): ${otpPlain}`,
                        },
                    });
                }
            });
        }, 3, "Job payment processing");

        logger.info("Job payment succeeded, job now OPEN", {
            jobId,
            correlationId
        });
    }
}

/**
 * Handle subscription creation/updates
 */
async function handleSubscriptionUpdated(subscription, correlationId) {
    const userId = subscription.metadata?.userId;
    const tier = subscription.metadata?.tier;

    if (!userId) {
        logger.warn("Subscription missing userId metadata", {
            subscriptionId: subscription.id,
            correlationId
        });
        return;
    }

    const planStatus = subscription.status === "active" ? "ACTIVE" : subscription.status === "past_due" ? "PAST_DUE" : "NONE";
    const planTier = tier?.toUpperCase() || "FREE";

    await withRetry(async () => {
        await prisma.user.update({
            where: { id: userId },
            data: {
                stripeSubscriptionId: subscription.id,
                planTier: planTier,
                planStatus: planStatus,
                planRenewsAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
            },
        });
    }, 3, "Subscription update");

    logger.info("Subscription updated", {
        userId,
        tier: planTier,
        status: planStatus,
        correlationId
    });
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription, correlationId) {
    const userId = subscription.metadata?.userId;

    if (!userId) {
        logger.warn("Subscription missing userId metadata", {
            subscriptionId: subscription.id,
            correlationId
        });
        return;
    }

    await withRetry(async () => {
        await prisma.user.update({
            where: { id: userId },
            data: {
                planTier: "FREE",
                planStatus: "CANCELED",
                planRenewsAt: null,
            },
        });
    }, 3, "Subscription deletion");

    logger.info("Subscription canceled", {
        userId,
        correlationId
    });
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaymentSucceeded(invoice, correlationId) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) return;

    await withRetry(async () => {
        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (!user) {
            logger.warn("User not found for customer", {
                customerId,
                correlationId
            });
            return;
        }

        // Ensure plan status is ACTIVE on successful payment
        await prisma.user.update({
            where: { id: user.id },
            data: { planStatus: "ACTIVE" },
        });

        logger.info("Invoice payment succeeded", {
            userId: user.id,
            invoiceId: invoice.id,
            correlationId
        });
    }, 3, "Invoice payment success");
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice, correlationId) {
    const customerId = invoice.customer;

    await withRetry(async () => {
        const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (!user) {
            logger.warn("User not found for customer", {
                customerId,
                correlationId
            });
            return;
        }

        // Mark plan as PAST_DUE
        await prisma.user.update({
            where: { id: user.id },
            data: { planStatus: "PAST_DUE" },
        });

        logger.warn("Invoice payment failed", {
            userId: user.id,
            invoiceId: invoice.id,
            correlationId
        });
    }, 3, "Invoice payment failure");
}

/**
 * Handle checkout.session.expired
 * Logs payment failure for auditability
 */
async function handleCheckoutExpired(session, correlationId) {
    const { metadata } = session;

    if (metadata?.kind === "job_payment") {
        const { jobId } = metadata;

        logger.info("Stripe Checkout session expired", {
            jobId,
            sessionId: session.id,
            correlationId
        });

        if (jobId) {
            await logJobEvent({
                jobId,
                type: "PAYMENT_FAILED",
                actorUserId: null,
                message: "Stripe Checkout session expired",
            });
        }
    }
}

module.exports = router;
