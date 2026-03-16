/**
 * Pricing tiers for Infæmous Freight services
 * Used in pricing pages and onboarding flow
 */

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  cta: string;
  popular?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    features: [
      'Up to 10 shipments/month',
      'Basic tracking',
      'Email support',
      'Standard documentation',
    ],
    cta: 'Get Started',
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 299,
    features: [
      'Up to 100 shipments/month',
      'Real-time tracking',
      'Priority support',
      'Advanced analytics',
      'API access',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    features: [
      'Unlimited shipments',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom integrations',
      'SLA guarantees',
      'White-label options',
    ],
    cta: 'Contact Sales',
  },
];

export const MARKETPLACE_TIER = {
  id: 'marketplace',
  name: 'Marketplace',
  description: 'Pay per shipment with no monthly fees',
  commission: 15,
  features: [
    'No monthly commitment',
    '15% commission per shipment',
    'Access to carrier network',
    'Basic tracking',
  ],
};

export const FEATURE_COMPARISON = {
  shipments: {
    basic: '10/month',
    pro: '100/month',
    enterprise: 'Unlimited',
    marketplace: 'Pay per use',
  },
  tracking: {
    basic: 'Basic',
    pro: 'Real-time',
    enterprise: 'Real-time + Custom',
    marketplace: 'Basic',
  },
  support: {
    basic: 'Email',
    pro: 'Priority',
    enterprise: '24/7 Phone',
    marketplace: 'Email',
  },
  api: {
    basic: false,
    pro: true,
    enterprise: true,
    marketplace: false,
  },
};
