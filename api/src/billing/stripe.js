const Stripe = require("stripe");
const { env } = require("../config/env");

function stripeClient() {
    if (!env.STRIPE_SECRET_KEY) return null;
    return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
}

function isStripeConfigured() {
    return !!env.STRIPE_SECRET_KEY;
}

function priceCatalog() {
    return [
        { key: "starter", label: "Starter", priceId: env.STRIPE_PRICE_STARTER },
        { key: "growth", label: "Growth", priceId: env.STRIPE_PRICE_GROWTH },
        { key: "pro", label: "Pro", priceId: env.STRIPE_PRICE_PRO },
        {
            key: "enterprise",
            label: "Enterprise",
            priceId: env.STRIPE_PRICE_ENTERPRISE,
        },
    ];
}

module.exports = { stripeClient, isStripeConfigured, priceCatalog };
