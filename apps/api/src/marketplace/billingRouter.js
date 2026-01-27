/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Billing & Subscription Router (Marketplace Tiers)
 */

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { stripe } = require("../lib/stripe");
const { authenticate, requireScope, limiters } = require("../middleware/security");
const { subscribeSchema } = require("./validators");

const prisma = new PrismaClient();
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Get Stripe price ID for subscription tier
 */
function priceIdForTier(tier) {
    const env =
        tier === "STARTER"
            ? process.env.STRIPE_PRICE_STARTER
            : tier === "PRO"
                ? process.env.STRIPE_PRICE_PRO
                : process.env.STRIPE_PRICE_ENTERPRISE;

    if (!env) {
        throw new Error(`Missing Stripe price id env for ${tier}`);
    }
    return env;
}

/**
 * Create subscription checkout for a shipper (tiered plans)
 */
router.post("/subscribe",
    limiters.billing,
    requireScope("shipper:subscribe"),
    async (req, res, next) => {
        try {
            const parsed = subscribeSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten() });
            }

            const { userId, tier } = parsed.data;

            // Verify user matches authenticated user
            if (req.user?.sub !== userId) {
                return res.status(403).json({ error: "Cannot subscribe for another user" });
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ error: "User not found" });
            if (user.role !== "SHIPPER" && user.role !== "ADMIN") {
                return res.status(403).json({ error: "Only shippers can subscribe" });
            }

            const publicUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";

            // Ensure Stripe customer
            let customerId = user.stripeCustomerId || undefined;
            if (!customerId) {
                const customer = await stripe.customers.create({
                    email: user.email,
                    name: user.name ?? undefined,
                    metadata: { userId: user.id },
                });
                customerId = customer.id;

                await prisma.user.update({
                    where: { id: user.id },
                    data: { stripeCustomerId: customerId },
                });
            }

            const session = await stripe.checkout.sessions.create({
                mode: "subscription",
                customer: customerId,
                line_items: [{ price: priceIdForTier(tier), quantity: 1 }],
                success_url: `${publicUrl}/billing/success?tier=${tier}`,
                cancel_url: `${publicUrl}/billing/cancel`,
                metadata: {
                    kind: "subscription",
                    userId: user.id,
                    tier,
                },
            });

            res.json({ ok: true, checkoutUrl: session.url, sessionId: session.id });
        } catch (err) {
            next(err);
        }
    });

/**
 * Customer Portal: manage subscription, payment methods, invoices
 */
router.post("/portal",
    limiters.billing,
    requireScope("shipper:portal"),
    async (req, res, next) => {
        try {
            const userId = String(req.body?.userId || req.user?.sub || "");
            if (!userId) {
                return res.status(400).json({ error: "Missing userId" });
            }

            // Verify user is accessing their own portal
            if (req.user?.sub !== userId) {
                return res.status(403).json({ error: "Cannot access portal for another user" });
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ error: "User not found" });

            if (!user.stripeCustomerId) {
                return res.status(400).json({ error: "No Stripe customer found for user" });
            }

            const publicUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";

            const portalSession = await stripe.billingPortal.sessions.create({
                customer: user.stripeCustomerId,
                return_url: `${publicUrl}/account/billing`,
            });

            res.json({ ok: true, portalUrl: portalSession.url });
        } catch (err) {
            next(err);
        }
    });

module.exports = router;
