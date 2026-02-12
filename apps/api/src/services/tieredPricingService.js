/**
 * Tiered Pricing Service (TIER 2)
 * Manages subscription tiers, pricing, and plan management
 */

const db = require("../db/prisma");
const Stripe = require("stripe");
const logger = require("../middleware/logger");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class TieredPricingService {
    constructor() {
        this.tiers = this.definePricingTiers();
    }

    /**
     * Define subscription tiers
     */
    definePricingTiers() {
        return {
            free: {
                id: "tier_free",
                name: "Free",
                price: 0,
                currency: "usd",
                billing_period: "monthly",
                features: {
                    apiRequests: 100,
                    aiRequests: 5,
                    shipments: 10,
                    users: 1,
                    support: "community",
                    storage: "500MB",
                    integrations: 1,
                    analytics: false,
                    sso: false,
                    customBranding: false,
                    sla: null,
                },
                stripePriceId: null,
            },
            pro: {
                id: "tier_pro",
                name: "Pro",
                price: 99,
                currency: "usd",
                billing_period: "monthly",
                features: {
                    apiRequests: 1000,
                    aiRequests: 100,
                    shipments: 1000,
                    users: 10,
                    support: "email",
                    storage: "50GB",
                    integrations: 5,
                    analytics: true,
                    sso: false,
                    customBranding: false,
                    sla: null,
                },
                stripePriceId: process.env.STRIPE_PRICE_PRO,
                savings: "20% vs standard",
            },
            enterprise: {
                id: "tier_enterprise",
                name: "Enterprise",
                price: 999,
                currency: "usd",
                billing_period: "monthly",
                features: {
                    apiRequests: 10000,
                    aiRequests: 1000,
                    shipments: 100000,
                    users: 100,
                    support: "24/7 dedicated",
                    storage: "unlimited",
                    integrations: "unlimited",
                    analytics: true,
                    sso: true,
                    customBranding: true,
                    sla: "99.9%",
                },
                stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
                savings: "30% vs pro",
            },
            marketplace: {
                id: "tier_marketplace",
                name: "Marketplace (White-Label)",
                price: "custom",
                currency: "usd",
                billing_period: "revenue-share",
                features: {
                    commission: "15% per transaction",
                    apiRequests: "unlimited",
                    shipments: "unlimited",
                    users: "unlimited",
                    support: "dedicated account manager",
                    storage: "unlimited",
                    integrations: "unlimited",
                    analytics: true,
                    sso: true,
                    customBranding: true,
                    sla: "99.95%",
                },
                stripePriceId: null,
            },
        };
    }

    /**
     * Get tier details
     */
    getTier(tierName) {
        return this.tiers[tierName.toLowerCase()] || this.tiers.free;
    }

    /**
     * List all tiers
     */
    listTiers() {
        return Object.entries(this.tiers).map(([key, tier]) => ({
            ...tier,
            key,
        }));
    }

    /**
     * Create subscription checkout session
     */
    async createCheckoutSession(userId, tierName, billingCycle = "monthly") {
        try {
            const tier = this.getTier(tierName);
            if (!tier.stripePriceId && tierName !== "free") {
                throw new Error(`Stripe price ID not configured for ${tierName} tier`);
            }

            const user = await db.user.findUnique({
                where: { id: userId },
                select: { email: true, stripeCustomerId: true },
            });

            const lineItems = [
                {
                    price: tier.stripePriceId,
                    quantity: 1,
                },
            ];

            if (billingCycle === "annual") {
                // Apply 20% annual discount
                lineItems[0].quantity = 12;
            }

            const session = await stripe.checkout.sessions.create({
                customer: user.stripeCustomerId,
                mode: "subscription",
                line_items: lineItems,
                success_url: `${process.env.WEB_BASE_URL}/account/billing?success=true`,
                cancel_url: `${process.env.WEB_BASE_URL}/pricing`,
                customer_email: user.email,
                metadata: {
                    userId,
                    tier: tierName,
                    billingCycle,
                },
            });

            logger.info("Checkout session created", { userId, tierName, sessionId: session.id });
            return session;
        } catch (err) {
            logger.error("Failed to create checkout session", { error: err, userId });
            throw err;
        }
    }

    /**
     * Upgrade subscription tier
     */
    async upgradeTier(userId, newTier, billingCycle = "monthly") {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: { stripeSubscriptionId: true, planTier: true },
            });

            const tier = this.getTier(newTier);

            if (user.planTier === newTier) {
                throw new Error("Already on this tier");
            }

            // Create new subscription
            const subscription = await stripe.subscriptions.create({
                customer: user.stripeCustomerId || undefined,
                items: [{ price: tier.stripePriceId }],
                billing_cycle_anchor: Math.floor(Date.now() / 1000),
                metadata: { userId, tier: newTier },
            });

            // Update user  in database
            await db.user.update({
                where: { id: userId },
                data: {
                    planTier: newTier.toUpperCase(),
                    stripeSubscriptionId: subscription.id,
                    planRenewsAt: new Date(subscription.current_period_end * 1000),
                },
            });

            logger.info("Tier upgraded", { userId, newTier });
            return { subscription, tier };
        } catch (err) {
            logger.error("Failed to upgrade tier", { error: err, userId });
            throw err;
        }
    }

    /**
     * Downgrade subscription tier
     */
    async downgradeTier(userId, newTier) {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: { stripeSubscriptionId: true },
            });

            const tier = this.getTier(newTier);

            if (user.stripeSubscriptionId && tier.stripePriceId) {
                // Update Stripe subscription
                await stripe.subscriptions.update(user.stripeSubscriptionId, {
                    items: [{ price: tier.stripePriceId }],
                    proration_behavior: "create_prorations",
                });
            }

            // Update in database
            await db.user.update({
                where: { id: userId },
                data: {
                    planTier: newTier.toUpperCase(),
                },
            });

            logger.info("Tier downgraded", { userId, newTier });
            return { tier, message: "Downgrade scheduled for next billing cycle" };
        } catch (err) {
            logger.error("Failed to downgrade tier", { error: err, userId });
            throw err;
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(userId, reason = "user_requested") {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: { stripeSubscriptionId: true },
            });

            if (user.stripeSubscriptionId) {
                await stripe.subscriptions.del(user.stripeSubscriptionId);
            }

            await db.user.update({
                where: { id: userId },
                data: {
                    planTier: "FREE",
                    planStatus: "CANCELED",
                },
            });

            logger.info("Subscription canceled", { userId, reason });
            return { success: true, message: "Subscription canceled" };
        } catch (err) {
            logger.error("Failed to cancel subscription", { error: err, userId });
            throw err;
        }
    }

    /**
     * Get user's current plan
     */
    async getCurrentPlan(userId) {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: {
                    planTier: true,
                    planRenewsAt: true,
                    stripeSubscriptionId: true,
                },
            });

            const tier = this.getTier(user.planTier || "FREE");

            return {
                tier: user.planTier,
                ...tier,
                renewsAt: user.planRenewsAt,
            };
        } catch (err) {
            logger.error("Failed to get current plan", { error: err, userId });
            throw err;
        }
    }

    /**
     * Calculate price with discounts
     */
    calculatePrice(tierName, billingCycle = "monthly", quantity = 1) {
        const tier = this.getTier(tierName);
        let price = tier.price * quantity;

        if (billingCycle === "annual") {
            price = price * 12 * 0.8; // 20% discount for annual
        }

        return {
            subtotal: tier.price * quantity,
            discount: billingCycle === "annual" ? tier.price * quantity * 2.4 : 0,
            total: price,
            billingCycle,
            currency: tier.currency,
        };
    }
}

module.exports = new TieredPricingService();
