const express = require("express");
const { z } = require("zod");
const { env } = require("../config/env");
const { authenticate } = require("../middleware/security");
const { priceCatalog, stripeClient, isStripeConfigured } = require("./stripe");
const persist = require("./persist");

const router = express.Router();

/**
 * GET /v1/billing/plans
 * Returns plan catalog (public).
 */
router.get("/plans", (_req, res) => {
    res.json({ ok: true, configured: isStripeConfigured(), plans: priceCatalog() });
});

/**
 * GET /v1/billing/me
 * Returns entitlements (DB optional).
 */
router.get("/me", authenticate, async (req, res) => {
    try {
        const userId = req.user?.sub || req.headers["x-user-id"] || "anonymous";
        const ent = await persist.getEntitlements(userId);
        res.json({ ok: true, userId, entitlements: ent });
    } catch (err) {
        res.status(500).json({ ok: false, error: err?.message || "Failed to load entitlements" });
    }
});

/**
 * POST /v1/billing/checkout
 * Body: { planKey: "starter"|"pro"|"enterprise" }
 */
router.post("/checkout", authenticate, async (req, res) => {
    try {
        const userId = req.user?.sub || req.headers["x-user-id"] || "anonymous";
        const Schema = z.object({
            planKey: z.enum(["starter", "pro", "enterprise"]),
        });
        const body = Schema.parse(req.body);

        const stripe = stripeClient();
        if (!stripe) {
            return res.status(400).json({
                ok: false,
                error: "Stripe not configured. Set STRIPE_SECRET_KEY + STRIPE_PRICE_* env vars.",
            });
        }

        const plan = priceCatalog().find((p) => p.key === body.planKey);
        if (!plan?.priceId) {
            return res
                .status(400)
                .json({ ok: false, error: "Missing priceId for plan in env" });
        }

        const successUrl =
            env.STRIPE_SUCCESS_URL || "http://localhost:3000/account/billing?success=1";
        const cancelUrl =
            env.STRIPE_CANCEL_URL || "http://localhost:3000/pricing?canceled=1";

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: plan.priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: userId,
            metadata: { userId, planKey: plan.key },
        });

        res.json({ ok: true, url: session.url });
    } catch (err) {
        res.status(500).json({ ok: false, error: err?.message || "Checkout failed" });
    }
});

/**
 * POST /v1/billing/portal
 * Creates a customer portal session.
 */
router.post("/portal", authenticate, async (req, res) => {
    try {
        const userId = req.user?.sub || req.headers["x-user-id"] || "anonymous";
        const stripe = stripeClient();
        if (!stripe) {
            return res
                .status(400)
                .json({ ok: false, error: "Stripe not configured" });
        }

        const Schema = z.object({ customerId: z.string() });
        const body = Schema.parse(req.body);
        const customerId = body.customerId;

        const returnUrl =
            env.STRIPE_SUCCESS_URL || "http://localhost:3000/account/billing";
        const portal = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        res.json({ ok: true, url: portal.url, userId });
    } catch (err) {
        res.status(500).json({ ok: false, error: err?.message || "Portal failed" });
    }
});

/**
 * POST /v1/billing/webhook
 * Stripe webhook handler (raw body required in production).
 */
router.post("/webhook", async (req, res) => {
    try {
        const stripe = stripeClient();
        if (!stripe) {
            return res
                .status(400)
                .json({ ok: false, error: "Stripe not configured" });
        }

        const sig = req.headers["stripe-signature"];
        let event;

        try {
            if (env.STRIPE_WEBHOOK_SECRET && sig) {
                const raw = req.rawBody || JSON.stringify(req.body);
                event = stripe.webhooks.constructEvent(
                    raw,
                    sig,
                    env.STRIPE_WEBHOOK_SECRET
                );
            } else {
                // Dev fallback (NOT for production)
                event = req.body;
            }
        } catch (e) {
            return res.status(400).json({
                ok: false,
                error: `Webhook signature verify failed: ${e?.message || "error"}`,
            });
        }

        // Handle key events
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const userId = session.client_reference_id || session.metadata?.userId;
            const customerId = session.customer;
            const subscriptionId = session.subscription;

            await persist.upsertSubscription({
                userId,
                provider: "stripe",
                customerId,
                subscriptionId,
                status: "active",
            });

            await persist.setEntitlement(
                userId,
                "plan",
                String(session.metadata?.planKey || "paid")
            );
            await persist.setEntitlement(userId, "features", "billing_enabled");
        }

        if (
            event.type === "customer.subscription.updated" ||
            event.type === "customer.subscription.deleted"
        ) {
            const sub = event.data.object;
            const status = sub.status;
            const customerId = sub.customer;
            // We may not know userId from this event; in Phase-15 we'll add customerId lookup.
            await persist.setEntitlement(String(customerId), "stripe_status", String(status));
        }

        res.json({ ok: true });
    } catch (err) {
        res
            .status(500)
            .json({ ok: false, error: err?.message || "webhook handler failed" });
    }
});

module.exports = router;
