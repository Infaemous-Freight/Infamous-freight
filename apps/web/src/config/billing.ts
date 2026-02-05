export const BILLING = {
  annualDiscountPct: 15,

  tiers: {
    operator: {
      key: "operator",
      name: "Operator",
      priceMonthly: 19,
      aiIncluded: 100,
      aiOverage: 0.01,
      aiHardCapMultiplier: 2,
      bullets: ["Dispatch board", "Load tracking", "Invoicing lite", "Standard support"],
      stripePriceIdEnv: "OPERATOR_PRICE_ID",
      stripeLinkEnv: "STRIPE_LINK_OPERATOR",
    },
    fleet: {
      key: "fleet",
      name: "Fleet",
      priceMonthly: 49,
      aiIncluded: 500,
      aiOverage: 0.008,
      aiHardCapMultiplier: 2,
      bullets: ["Advanced routing", "Predictive ETAs", "API access", "Priority support"],
      mostPopular: true,
      stripePriceIdEnv: "FLEET_PRICE_ID",
      stripeLinkEnv: "STRIPE_LINK_FLEET",
    },
    enterprise: {
      key: "enterprise",
      name: "Enterprise",
      priceMonthly: 149,
      aiIncluded: 2000,
      aiOverage: 0.005,
      aiHardCapMultiplier: 2,
      minimumMonthlySpend: 2500,
      bullets: [
        "Automation rules",
        "RBAC & audit logs",
        "Dispatch AI autopilot",
        "Dedicated account support",
      ],
      stripePriceIdEnv: "ENTERPRISE_SEAT_PRICE_ID",
      stripeLinkEnv: "STRIPE_LINK_ENTERPRISE_MIN",
      invoiceOnly: true,
    },
  },

  addOns: {
    intelligence: {
      key: "intelligence",
      name: "Intelligence Add-On",
      priceMonthly: 299,
      bullets: [
        "Weather disruption modeling",
        "Delay prediction",
        "Risk scoring",
        "Satellite/route signals",
      ],
      stripePriceIdEnv: "INTELLIGENCE_ADDON_PRICE_ID",
    },
  },

  aiMetered: {
    // Must be a metered recurring Price in Stripe (usage_type=metered)
    stripePriceIdEnv: "AI_METERED_PRICE_ID",
    unitName: "AI action",
  },
} as const;

export type TierKey = keyof typeof BILLING.tiers;
