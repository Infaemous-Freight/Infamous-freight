/**
 * Worldwide Pricing Configuration - 2026 Edition
 * Pricing adjusted for global markets with regional variations
 * All prices in local currency or USD equivalent
 */

const WORLDWIDE_PRICING = {
  // ============================================================================
  // SUBSCRIPTION PLANS - GLOBAL BASE PRICING (USD)
  // ============================================================================

  subscriptions: {
    FREE: {
      id: "plan_free",
      name: "Free",
      price: 0,
      currency: "USD",
      interval: null,
      billing: "free",
      description: "Perfect for getting started with Infæmous Freight",
      features: {
        shipments: 10,
        activeShipments: 2,
        users: 1,
        drivers: 0,
        storage: "2GB",
        support: "community",
        api: false,
        analytics: false,
        realtime: false,
        webhooks: false,
      },
      limits: {
        apiCallsPerDay: 100,
        storageGB: 2,
        activeShipmentsPerMonth: 10,
      },
    },

    STARTER: {
      id: "price_starter_monthly",
      name: "Starter",
      price: 79,
      annualPrice: 790,
      currency: "USD",
      interval: "month",
      billing: "subscription",
      description: "For small freight operations and local businesses",
      features: {
        shipments: 500,
        activeShipments: 20,
        users: 3,
        drivers: 5,
        storage: "100GB",
        support: "email-24h",
        api: true,
        analytics: "basic",
        realtime: true,
        webhooks: "basic",
        sso: false,
      },
      limits: {
        apiCallsPerDay: 10000,
        storageGB: 100,
        driverTracking: "yes",
        advancedAnalytics: false,
        customReports: false,
      },
      pricePerAdditional: {
        shipment: 0.15,
        driver: 5.0,
        user: 8.0,
      },
    },

    PROFESSIONAL: {
      id: "price_professional_monthly",
      name: "Professional",
      price: 199,
      annualPrice: 1990,
      currency: "USD",
      interval: "month",
      billing: "subscription",
      description: "For growing freight businesses and regional operators",
      features: {
        shipments: 2500,
        activeShipments: 100,
        users: 10,
        drivers: 25,
        storage: "500GB",
        support: "priority-email-12h",
        api: true,
        analytics: "advanced",
        realtime: true,
        webhooks: "unlimited",
        sso: "saml",
        aiRouting: true,
        predictiveAnalytics: true,
      },
      limits: {
        apiCallsPerDay: 100000,
        storageGB: 500,
        driverTracking: "unlimited",
        advancedAnalytics: "yes",
        customReports: 10,
        aiOptimizationMonth: 1000,
      },
      pricePerAdditional: {
        shipment: 0.08,
        driver: 3.5,
        user: 5.0,
      },
    },

    ENTERPRISE: {
      id: "price_enterprise_monthly",
      name: "Enterprise",
      price: 599,
      annualPrice: 5990,
      currency: "USD",
      interval: "month",
      billing: "subscription",
      description: "For large-scale freight networks and enterprise logistics",
      features: {
        shipments: "unlimited",
        activeShipments: "unlimited",
        users: "unlimited",
        drivers: "unlimited",
        storage: "5TB",
        support: "24/7-phone-video",
        api: true,
        analytics: "enterprise",
        realtime: "true",
        webhooks: "unlimited",
        sso: "saml-oauth-oidc",
        aiRouting: true,
        predictiveAnalytics: true,
        customIntegrations: true,
        dedicatedAccount: true,
        sla: "99.95%",
      },
      limits: {
        apiCallsPerDay: 1000000,
        storageGB: 5000,
        driverTracking: "unlimited",
        advancedAnalytics: "yes",
        customReports: "unlimited",
        aiOptimizationMonth: "unlimited",
        dedicatedSupport: "yes",
        onPremiseOption: "available",
      },
      pricePerAdditional: {
        shipment: 0.05,
        driver: 2.0,
        user: 3.0,
      },
    },
  },

  // ============================================================================
  // PER-SHIPMENT PRICING (Pay-as-you-go)
  // ============================================================================

  perShipment: {
    base: {
      // Base rate per shipment (USD)
      domestic: 2.5,
      international: 5.0,
      sameDayDelivery: 8.0,
    },
    byWeight: {
      // Rate per kilogram (USD)
      local: { base: 0.5, min: 2.5 },
      regional: { base: 0.75, min: 5.0 },
      international: { base: 1.5, min: 10.0 },
    },
    byDistance: {
      // Rate per kilometer (USD)
      local: { base: 0.08, min: 2.5 }, // <50km
      regional: { base: 0.12, min: 5.0 }, // 50-500km
      longHaul: { base: 0.15, min: 10.0 }, // >500km
    },
    surcharges: {
      hazmat: 25.0,
      fragile: 15.0,
      coldChain: 20.0,
      temperatureControlled: 30.0,
      oversize: 50.0,
      heavyLoad: 40.0, // >500kg
      rushDelivery: 50.0,
      guaranteedTime: 35.0,
      insured: 0.02, // 2% of declared value
    },
  },

  // ============================================================================
  // REGIONAL PRICING ADJUSTMENTS (Multipliers to base USD price)
  // ============================================================================

  regionalAdjustments: {
    // North America
    "US-East": { multiplier: 1.0, currency: "USD" },
    "US-West": { multiplier: 1.05, currency: "USD" },
    "US-Central": { multiplier: 0.95, currency: "USD" },
    "Canada-East": { multiplier: 1.15, currency: "CAD", usdRate: 1.35 },
    "Canada-West": { multiplier: 1.2, currency: "CAD", usdRate: 1.35 },

    // Europe
    UK: { multiplier: 1.1, currency: "GBP", usdRate: 1.27 },
    Germany: { multiplier: 1.08, currency: "EUR", usdRate: 1.1 },
    France: { multiplier: 1.12, currency: "EUR", usdRate: 1.1 },
    Spain: { multiplier: 0.95, currency: "EUR", usdRate: 1.1 },
    Italy: { multiplier: 1.0, currency: "EUR", usdRate: 1.1 },
    Benelux: { multiplier: 1.05, currency: "EUR", usdRate: 1.1 },
    Scandinavia: { multiplier: 1.25, currency: "EUR", usdRate: 1.1 },
    "Eastern Europe": { multiplier: 0.7, currency: "EUR", usdRate: 1.1 },
    Russia: { multiplier: 0.6, currency: "RUB", usdRate: 100.0 },

    // Asia Pacific
    Japan: { multiplier: 1.3, currency: "JPY", usdRate: 150.0 },
    "South Korea": { multiplier: 1.15, currency: "KRW", usdRate: 1300.0 },
    China: { multiplier: 0.65, currency: "CNY", usdRate: 7.25 },
    Singapore: { multiplier: 1.2, currency: "SGD", usdRate: 1.35 },
    Australia: { multiplier: 1.25, currency: "AUD", usdRate: 1.55 },
    India: { multiplier: 0.4, currency: "INR", usdRate: 83.0 },
    Thailand: { multiplier: 0.5, currency: "THB", usdRate: 35.0 },
    Vietnam: { multiplier: 0.45, currency: "VND", usdRate: 24500.0 },

    // Latin America
    Brazil: { multiplier: 0.75, currency: "BRL", usdRate: 5.0 },
    Mexico: { multiplier: 0.85, currency: "MXN", usdRate: 17.0 },
    Argentina: { multiplier: 0.5, currency: "ARS", usdRate: 42.0 },
    Colombia: { multiplier: 0.7, currency: "COP", usdRate: 4000.0 },

    // Middle East & Africa
    UAE: { multiplier: 1.0, currency: "AED", usdRate: 3.67 },
    "Saudi Arabia": { multiplier: 0.95, currency: "SAR", usdRate: 3.75 },
    Israel: { multiplier: 1.1, currency: "ILS", usdRate: 3.8 },
    "South Africa": { multiplier: 0.65, currency: "ZAR", usdRate: 18.5 },
    Egypt: { multiplier: 0.35, currency: "EGP", usdRate: 30.0 },
    Nigeria: { multiplier: 0.55, currency: "NGN", usdRate: 1500.0 },
  },

  // ============================================================================
  // SPECIAL SERVICES & ADD-ONS
  // ============================================================================

  addOns: {
    insurance: {
      name: "Shipment Insurance",
      description: "Coverage up to declared value",
      pricing: "percentOfValue", // 2%
      percent: 2.0,
      minCharge: 5.0,
    },
    signatureConfirmation: {
      name: "Signature Confirmation",
      description: "Recipient signature required",
      price: 8.0,
    },
    photoProof: {
      name: "Photo Proof of Delivery",
      description: "Automatic photo capture at delivery",
      price: 5.0,
    },
    addressValidation: {
      name: "Address Validation & Correction",
      description: "Ensure accurate delivery address",
      price: 3.0,
    },
    gpsTracking: {
      name: "Advanced GPS Tracking",
      description: "Real-time tracking updates",
      price: 10.0,
      interval: "month",
    },
    whiteLabel: {
      name: "White Label Solution",
      description: "Custom branding for your shipments",
      price: 500.0,
      interval: "month",
      minCommitment: 6,
    },
    apiIntegration: {
      name: "Custom API Integration",
      description: "Dedicated technical support",
      price: 2000.0,
      oneTime: true,
    },
    webhooksAdvanced: {
      name: "Advanced Webhooks",
      description: "Real-time event streaming",
      price: 200.0,
      interval: "month",
    },
  },

  // ============================================================================
  // BULK DISCOUNTS (Annual Shipments)
  // ============================================================================

  bulkDiscounts: {
    perShipment: {
      "100-500": 0.05, // 5% discount
      "501-1000": 0.1, // 10% discount
      "1001-5000": 0.15, // 15% discount
      "5001-10000": 0.2, // 20% discount
      "10001+": 0.25, // 25% discount
    },
    volumeDiscounts: {
      q1: 0.0,
      q2: 0.05,
      q3: 0.1,
      q4: 0.15,
      annual: 0.2,
    },
  },

  // ============================================================================
  // PRICING FOR SPECIFIC FREIGHT TYPES
  // ============================================================================

  freightTypes: {
    general: {
      name: "General Cargo",
      baseCost: 1.0, // Multiplier
      description: "Standard freight",
    },
    hazmat: {
      name: "Hazardous Materials",
      baseCost: 3.0,
      surcharge: 25.0,
      description: "Class 3-9 hazmat with special handling",
      requirements: ["hazmat-certification", "special-packaging"],
    },
    refrigerated: {
      name: "Refrigerated/Cold Chain",
      baseCost: 2.0,
      surcharge: 20.0,
      description: "Temperature-controlled transport",
      requirements: ["cold-chain-cert", "monitoring"],
    },
    pharmaceutical: {
      name: "Pharmaceutical",
      baseCost: 3.5,
      surcharge: 40.0,
      description: "Regulated pharmaceutical transport",
      requirements: ["pharma-license", "gxp-certified"],
    },
    food: {
      name: "Food & Beverage",
      baseCost: 1.8,
      surcharge: 15.0,
      description: "Food safety certified transport",
      requirements: ["food-cert", "hygiene-trained"],
    },
    automotive: {
      name: "Automotive Parts",
      baseCost: 1.5,
      surcharge: 10.0,
      description: "Automotive components",
    },
    electronics: {
      name: "Electronics & Sensitive",
      baseCost: 2.0,
      surcharge: 15.0,
      description: "Anti-static, vibration controlled",
      requirements: ["esd-training"],
    },
    furniture: {
      name: "Furniture & Large Items",
      baseCost: 1.5,
      surcharge: 12.0,
      description: "White glove delivery available",
    },
    art: {
      name: "Fine Art & Antiques",
      baseCost: 3.0,
      surcharge: 50.0,
      description: "Museum-grade handling",
      requirements: ["art-handling-cert", "insurance-required"],
    },
  },

  // ============================================================================
  // SERVICE LEVELS
  // ============================================================================

  serviceLevels: {
    standard: {
      name: "Standard Delivery",
      estimatedDays: "5-7",
      baseCost: 1.0,
      surcharge: 0.0,
    },
    express: {
      name: "Express Delivery",
      estimatedDays: "2-3",
      baseCost: 1.0,
      surcharge: 15.0,
    },
    nextDay: {
      name: "Next Day Delivery",
      estimatedDays: "1",
      baseCost: 1.0,
      surcharge: 35.0,
    },
    sameDay: {
      name: "Same Day Delivery",
      estimatedDays: "same-day",
      baseCost: 1.0,
      surcharge: 75.0,
      availability: ["US-East", "US-West", "Germany", "UK", "Japan"],
    },
    scheduled: {
      name: "Scheduled Delivery",
      estimatedDays: "flexible",
      baseCost: 1.0,
      surcharge: 8.0,
    },
  },

  // ============================================================================
  // PAYMENT METHODS & TERMS
  // ============================================================================

  paymentTerms: {
    creditCard: {
      name: "Credit Card",
      processingFee: 0.029, // 2.9%
      minFee: 0.3,
      supported: ["visa", "mastercard", "amex", "discover"],
    },
    bankTransfer: {
      name: "Bank Transfer (ACH)",
      processingFee: 0.01, // 1%
      minFee: 0.0,
      processing: "3-5 days",
      available: ["US", "EU", "UK"],
    },
    paypal: {
      name: "PayPal",
      processingFee: 0.049, // 4.9% + $0.30
      minFee: 0.3,
    },
    stripe: {
      name: "Stripe",
      processingFee: 0.029, // 2.9% + $0.30
      minFee: 0.3,
    },
    invoice: {
      name: "Invoice (Net 30)",
      processingFee: 0.0,
      minAmount: 1000.0,
      creditCheck: true,
      available: ["enterprise", "professional"],
    },
  },

  // ============================================================================
  // SUPPORT TIERS
  // ============================================================================

  supportTiers: {
    community: {
      name: "Community Support",
      responseTime: "48 hours",
      channels: ["email", "community-forum"],
      included: "free",
    },
    email: {
      name: "Email Support",
      responseTime: "24 hours",
      channels: ["email", "ticket-system"],
      price: 0.0,
      included: ["starter", "professional", "enterprise"],
    },
    priority: {
      name: "Priority Support",
      responseTime: "12 hours",
      channels: ["email", "priority-phone", "ticket-system"],
      price: 0.0,
      included: ["professional", "enterprise"],
    },
    premium: {
      name: "Premium 24/7 Support",
      responseTime: "2 hours",
      channels: ["phone", "email", "video-call", "slack"],
      price: 299.0,
      interval: "month",
      included: ["enterprise"],
    },
    dedicated: {
      name: "Dedicated Account Manager",
      responseTime: "1 hour",
      channels: ["phone", "email", "video-call", "slack", "direct"],
      price: 999.0,
      interval: "month",
      included: ["enterprise"],
    },
  },

  // ============================================================================
  // CURRENCY CONVERSION & EXCHANGE RATES (Updated Jan 2026)
  // ============================================================================

  exchangeRates: {
    USD: 1.0,
    EUR: 1.1,
    GBP: 1.27,
    JPY: 150.0,
    AUD: 1.55,
    CAD: 1.35,
    CHF: 0.92,
    CNY: 7.25,
    INR: 83.0,
    MXN: 17.0,
    BRL: 5.0,
    AED: 3.67,
    SGD: 1.35,
    HKD: 7.8,
    KRW: 1300.0,
    RUB: 100.0,
    ZAR: 18.5,
    NOK: 10.8,
    SEK: 10.5,
    DKK: 6.95,
  },

  // ============================================================================
  // PROMOTIONAL & SEASONAL PRICING
  // ============================================================================

  promotions: {
    newCustomer: {
      name: "New Customer Discount",
      discount: 0.2, // 20% off
      duration: 30, // days
      minOrder: 50.0,
    },
    volumeCommitment: {
      name: "Volume Commitment Discount",
      discount: 0.15, // 15% off
      minShipments: 100,
      period: "month",
    },
    annualPlan: {
      name: "Annual Plan Discount",
      discount: 0.2, // 20% off
      autoRenewal: true,
    },
    referral: {
      name: "Referral Program",
      discount: 0.15, // 15% off referred customer
      credit: 50.0, // $50 credit for referrer
    },
    seasonal: {
      offseason: { discount: 0.25, months: ["June", "July", "August"] },
      peakseason: { surcharge: 0.3, months: ["November", "December"] },
    },
  },
};

module.exports = WORLDWIDE_PRICING;
