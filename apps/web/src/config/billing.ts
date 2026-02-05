export const BILLING = {
  annualDiscountPct: 15,
  tiers: {
    operator: {
      name: "Operator",
      priceMonthly: 19,
      aiIncluded: 100,
      aiOverage: 0.01,
      aiHardCapMultiplier: 2,
      stripeLink: "https://buy.stripe.com/4gM8wQ7GI2Fs38i53FcV20Q",
      bullets: ["Dispatch board", "Load tracking", "Invoicing lite", "Standard support"],
    },
    fleet: {
      name: "Fleet",
      priceMonthly: 49,
      aiIncluded: 500,
      aiOverage: 0.008,
      aiHardCapMultiplier: 2,
      stripeLink: "https://buy.stripe.com/bJeaEYbWYcg210a9jVcV20S",
      bullets: ["Advanced routing", "Predictive ETAs", "API access", "Priority support"],
      mostPopular: true,
    },
    enterprise: {
      name: "Enterprise",
      priceMonthly: 149,
      aiIncluded: 2000,
      aiOverage: 0.005,
      aiHardCapMultiplier: 2,
      stripeMinimumSpendLink: "https://buy.stripe.com/28E5kE1ik7ZMcIS8fRcV20W",
      bullets: [
        "Automation rules",
        "RBAC & audit logs",
        "Dispatch AI autopilot",
        "Dedicated account support",
      ],
    },
  },
  addOns: {
    intelligence: {
      name: "Intelligence Add-On",
      priceMonthly: 299,
      bullets: [
        "Weather disruption modeling",
        "Delay prediction",
        "Risk scoring",
        "Satellite/route signals",
      ],
    },
  },
} as const;

export type BillingTierKey = keyof typeof BILLING.tiers;
