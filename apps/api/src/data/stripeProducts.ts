// Stripe Product Configuration - 4-Tier Model (2026)
// This file defines all subscription tiers and pricing

export const STRIPE_PRODUCTS = {
  FREE: {
    id: 'prod_free_2026',
    name: 'FREE',
    price_id: 'price_free_2026',
    amount: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      ' 100 API calls/month',
      '10 shipments/month',
      '1 user',
      'Community support',
      'Mobile app access',
    ],
    limits: {
      api_calls: 100,
      shipments: 10,
      users: 1,
      storage_mb: 500,
      integrations: 1,
    },
    trial_days: null, // Unlimited trial
    description: 'Perfect for individual drivers - no credit card required',
  },
  PRO: {
    id: 'prod_pro_2026',
    name: 'PRO',
    price_id: 'price_pro_2026_monthly',
    price_id_annual: 'price_pro_2026_annual',
    amount: 9900, // $99/month in cents
    amount_annual: 118800, // $1,188/year = $99/month
    currency: 'usd',
    interval: 'month',
    features: [
      '1,000 API calls/month',
      '1,000 shipments/month',
      'Up to 10 team members',
      '50GB storage',
      '5+ integrations',
      'Automated invoicing',
      'Priority support (email + phone)',
      'Metered overage: $0.01/load',
    ],
    limits: {
      api_calls: 1000,
      shipments: 1000,
      users: 10,
      storage_mb: 51200,
      integrations: 5,
    },
    trial_days: 14,
    description: 'For small fleets (2-50 trucks)',
    annual_discount_percent: 20,
  },
  ENTERPRISE: {
    id: 'prod_enterprise_2026',
    name: 'ENTERPRISE',
    price_id: 'price_enterprise_2026_monthly',
    price_id_annual: 'price_enterprise_2026_annual',
    amount: 99900, // $999/month in cents
    amount_annual: 119880, // $9,990/year = $999/month
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited API calls',
      'Unlimited shipments',
      'Up to 100 team members',
      'Unlimited storage',
      'Unlimited integrations',
      '99.9% SLA guarantee',
      'Dedicated account manager',
      'White-label platform',
      'SSO/SAML authentication',
      'Custom branding',
      '24/7 priority support',
    ],
    limits: {
      api_calls: -1, // unlimited
      shipments: -1,
      users: 100,
      storage_mb: -1,
      integrations: -1,
    },
    trial_days: 7,
    description: 'For regional carriers (50-500 trucks)',
    annual_discount_percent: 0.75, // $90 discount when paid yearly
  },
  MARKETPLACE: {
    id: 'prod_marketplace_2026',
    name: 'MARKETPLACE',
    price_id: null,
    amount: null, // Revenue-share model, no fixed cost
    currency: 'usd',
    interval: null,
    features: [
      'Everything in Enterprise',
      'Unlimited API calls',
      'Dedicated partnership manager',
      'Co-marketing fund ($10K-$100K/year)',
      'Revenue-share commission: 15%',
      '90-day net payment terms',
      'Lead distribution system',
      'Marketplace listing & promotion',
    ],
    limits: {
      api_calls: -1,
      shipments: -1,
      users: -1,
      storage_mb: -1,
      integrations: -1,
    },
    trial_days: null,
    description: 'For partners & integrators - 15% revenue-share model',
    revenue_share_percent: 15,
  },
};

// Usage-based metering for overages
export const METERED_PRICING = {
  api_calls: {
    tier_free: { threshold: 100, rate: 0 },
    tier_pro: { threshold: 1000, rate: 0.0001 }, // $0.10 per 1000 calls = $0.0001 per call
    tier_enterprise: { threshold: 10000, rate: 0.00001 }, // $0.10 per 10000 calls
  },
  shipments: {
    tier_free: { threshold: 10, rate: 0 },
    tier_pro: { threshold: 1000, rate: 0.01 }, // $0.01 per shipment after 1000
    tier_enterprise: { threshold: -1, rate: 0 }, // Unlimited
  },
};

// Conversion goals (targets for 2026)
export const CONVERSION_TARGETS = {
  free_to_pro: {
    target_percent: 30, // Slack benchmark: 30-40%
    timeline_days: 30,
    trigger: ['trial_expiration', 'feature_limit_reached', 'in_app_upsell'],
  },
  pro_to_enterprise: {
    target_percent: 15,
    timeline_days: 90,
    trigger: ['growth_milestone', 'sales_outreach', 'usage_threshold'],
  },
  pro_to_marketplace: {
    target_percent: 5,
    timeline_days: 180,
    trigger: ['partner_program_launch', 'sales_outreach'],
  },
};
