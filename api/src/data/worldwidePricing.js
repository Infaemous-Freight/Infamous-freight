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
            id: 'plan_free',
            name: 'Free',
            price: 0,
            currency: 'USD',
            interval: null,
            billing: 'free',
            description: 'Perfect for getting started with Infamous Freight',
            features: {
                shipments: 10,
                activeShipments: 2,
                users: 1,
                drivers: 0,
                storage: '2GB',
                support: 'community',
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
            id: 'price_starter_monthly',
            name: 'Starter',
            price: 29,
            annualPrice: 290,
            currency: 'USD',
            interval: 'month',
            billing: 'subscription',
            description: 'For owner-operators and small dispatch teams',
            features: {
                shipments: 10,
                activeShipments: 5,
                users: 1,
                drivers: 2,
                storage: '25GB',
                support: 'email-48h',
                api: false,
                analytics: 'basic',
                realtime: true,
                webhooks: false,
                sso: false,
                aiRouting: false,
            },
            limits: {
                apiCallsPerDay: 1000,
                storageGB: 25,
                driverTracking: 'yes',
                advancedAnalytics: false,
                customReports: false,
            },
            pricePerAdditional: {
                shipment: 1.5,
                driver: 5.00,
                user: 10.00,
            },
        },

        GROWTH: {
            id: 'price_growth_monthly',
            name: 'Growth',
            price: 99,
            annualPrice: 990,
            currency: 'USD',
            interval: 'month',
            billing: 'subscription',
            description: 'For growing dispatch teams with AI routing + SMS',
            features: {
                shipments: 100,
                activeShipments: 30,
                users: 5,
                drivers: 10,
                storage: '100GB',
                support: 'priority-email-24h',
                api: false,
                analytics: 'standard',
                realtime: true,
                webhooks: 'basic',
                sso: false,
                aiRouting: true,
                sms: true,
            },
            limits: {
                apiCallsPerDay: 20000,
                storageGB: 100,
                driverTracking: 'yes',
                advancedAnalytics: true,
                customReports: 5,
            },
            pricePerAdditional: {
                shipment: 1.25,
                driver: 4.00,
                user: 8.00,
            },
        },

        PRO: {
            id: 'price_pro_monthly',
            name: 'Pro',
            price: 249,
            annualPrice: 2490,
            currency: 'USD',
            interval: 'month',
            billing: 'subscription',
            description: 'Unlimited users with AI audit and advanced analytics',
            features: {
                shipments: 'unlimited',
                activeShipments: 'unlimited',
                users: 'unlimited',
                drivers: 'unlimited',
                storage: '1TB',
                support: 'priority-email-6h',
                api: true,
                analytics: 'advanced',
                realtime: true,
                webhooks: 'unlimited',
                sso: 'saml',
                aiRouting: true,
                aiInvoiceAudit: true,
            },
            limits: {
                apiCallsPerDay: 200000,
                storageGB: 1000,
                driverTracking: 'unlimited',
                advancedAnalytics: 'yes',
                customReports: 20,
                aiOptimizationMonth: 'unlimited',
            },
            pricePerAdditional: {
                shipment: 0,
                driver: 0,
                user: 0,
            },
        },

        ENTERPRISE: {
            id: 'price_enterprise_monthly',
            name: 'Enterprise',
            price: 0,
            currency: 'USD',
            interval: 'custom',
            billing: 'custom',
            description: 'Custom pricing with SLA, custom AI agents, and API access',
            features: {
                shipments: 'unlimited',
                activeShipments: 'unlimited',
                users: 'unlimited',
                drivers: 'unlimited',
                storage: '5TB',
                support: '24/7-phone-video',
                api: true,
                analytics: 'enterprise',
                realtime: 'true',
                webhooks: 'unlimited',
                sso: 'saml-oauth-oidc',
                aiRouting: true,
                aiInvoiceAudit: true,
                customAiAgents: true,
                customIntegrations: true,
                dedicatedAccount: true,
                sla: '99.95%',
            },
            limits: {
                apiCallsPerDay: 1000000,
                storageGB: 5000,
                driverTracking: 'unlimited',
                advancedAnalytics: 'yes',
                customReports: 'unlimited',
                aiOptimizationMonth: 'unlimited',
                dedicatedSupport: 'yes',
                onPremiseOption: 'available',
            },
            pricePerAdditional: {
                shipment: 0.05,
                driver: 2.00,
                user: 3.00,
            },
        },
    },

    // ============================================================================
    // PER-SHIPMENT PRICING (Pay-as-you-go)
    // ============================================================================

    perShipment: {
        base: {
            // Base rate per shipment (USD)
            domestic: 2.50,
            international: 5.00,
            sameDayDelivery: 8.00,
        },
        byWeight: {
            // Rate per kilogram (USD)
            local: { base: 0.50, min: 2.50 },
            regional: { base: 0.75, min: 5.00 },
            international: { base: 1.50, min: 10.00 },
        },
        byDistance: {
            // Rate per kilometer (USD)
            local: { base: 0.08, min: 2.50 }, // <50km
            regional: { base: 0.12, min: 5.00 }, // 50-500km
            longHaul: { base: 0.15, min: 10.00 }, // >500km
        },
        surcharges: {
            hazmat: 25.00,
            fragile: 15.00,
            coldChain: 20.00,
            temperatureControlled: 30.00,
            oversize: 50.00,
            heavyLoad: 40.00, // >500kg
            rushDelivery: 50.00,
            guaranteedTime: 35.00,
            insured: 0.02, // 2% of declared value
        },
    },

    // ============================================================================
    // REGIONAL PRICING ADJUSTMENTS (Multipliers to base USD price)
    // ============================================================================

    regionalAdjustments: {
        // North America
        'US-East': { multiplier: 1.0, currency: 'USD' },
        'US-West': { multiplier: 1.05, currency: 'USD' },
        'US-Central': { multiplier: 0.95, currency: 'USD' },
        'Canada-East': { multiplier: 1.15, currency: 'CAD', usdRate: 1.35 },
        'Canada-West': { multiplier: 1.20, currency: 'CAD', usdRate: 1.35 },

        // Europe
        'UK': { multiplier: 1.10, currency: 'GBP', usdRate: 1.27 },
        'Germany': { multiplier: 1.08, currency: 'EUR', usdRate: 1.10 },
        'France': { multiplier: 1.12, currency: 'EUR', usdRate: 1.10 },
        'Spain': { multiplier: 0.95, currency: 'EUR', usdRate: 1.10 },
        'Italy': { multiplier: 1.00, currency: 'EUR', usdRate: 1.10 },
        'Benelux': { multiplier: 1.05, currency: 'EUR', usdRate: 1.10 },
        'Scandinavia': { multiplier: 1.25, currency: 'EUR', usdRate: 1.10 },
        'Eastern Europe': { multiplier: 0.70, currency: 'EUR', usdRate: 1.10 },
        'Russia': { multiplier: 0.60, currency: 'RUB', usdRate: 100.00 },

        // Asia Pacific
        'Japan': { multiplier: 1.30, currency: 'JPY', usdRate: 150.00 },
        'South Korea': { multiplier: 1.15, currency: 'KRW', usdRate: 1300.00 },
        'China': { multiplier: 0.65, currency: 'CNY', usdRate: 7.25 },
        'Singapore': { multiplier: 1.20, currency: 'SGD', usdRate: 1.35 },
        'Australia': { multiplier: 1.25, currency: 'AUD', usdRate: 1.55 },
        'India': { multiplier: 0.40, currency: 'INR', usdRate: 83.00 },
        'Thailand': { multiplier: 0.50, currency: 'THB', usdRate: 35.00 },
        'Vietnam': { multiplier: 0.45, currency: 'VND', usdRate: 24500.00 },

        // Latin America
        'Brazil': { multiplier: 0.75, currency: 'BRL', usdRate: 5.00 },
        'Mexico': { multiplier: 0.85, currency: 'MXN', usdRate: 17.00 },
        'Argentina': { multiplier: 0.50, currency: 'ARS', usdRate: 42.00 },
        'Colombia': { multiplier: 0.70, currency: 'COP', usdRate: 4000.00 },

        // Middle East & Africa
        'UAE': { multiplier: 1.00, currency: 'AED', usdRate: 3.67 },
        'Saudi Arabia': { multiplier: 0.95, currency: 'SAR', usdRate: 3.75 },
        'Israel': { multiplier: 1.10, currency: 'ILS', usdRate: 3.80 },
        'South Africa': { multiplier: 0.65, currency: 'ZAR', usdRate: 18.50 },
        'Egypt': { multiplier: 0.35, currency: 'EGP', usdRate: 30.00 },
        'Nigeria': { multiplier: 0.55, currency: 'NGN', usdRate: 1500.00 },
    },

    // ============================================================================
    // SPECIAL SERVICES & ADD-ONS
    // ============================================================================

    addOns: {
        insurance: {
            name: 'Shipment Insurance',
            description: 'Coverage up to declared value',
            pricing: 'percentOfValue', // 2%
            percent: 2.0,
            minCharge: 5.00,
        },
        signatureConfirmation: {
            name: 'Signature Confirmation',
            description: 'Recipient signature required',
            price: 8.00,
        },
        photoProof: {
            name: 'Photo Proof of Delivery',
            description: 'Automatic photo capture at delivery',
            price: 5.00,
        },
        addressValidation: {
            name: 'Address Validation & Correction',
            description: 'Ensure accurate delivery address',
            price: 3.00,
        },
        gpsTracking: {
            name: 'Advanced GPS Tracking',
            description: 'Real-time tracking updates',
            price: 10.00,
            interval: 'month',
        },
        whiteLabel: {
            name: 'White Label Solution',
            description: 'Custom branding for your shipments',
            price: 500.00,
            interval: 'month',
            minCommitment: 6,
        },
        apiIntegration: {
            name: 'Custom API Integration',
            description: 'Dedicated technical support',
            price: 2000.00,
            oneTime: true,
        },
        webhooksAdvanced: {
            name: 'Advanced Webhooks',
            description: 'Real-time event streaming',
            price: 200.00,
            interval: 'month',
        },
    },

    // ============================================================================
    // BULK DISCOUNTS (Annual Shipments)
    // ============================================================================

    bulkDiscounts: {
        perShipment: {
            '100-500': 0.05, // 5% discount
            '501-1000': 0.10, // 10% discount
            '1001-5000': 0.15, // 15% discount
            '5001-10000': 0.20, // 20% discount
            '10001+': 0.25, // 25% discount
        },
        volumeDiscounts: {
            'q1': 0.00,
            'q2': 0.05,
            'q3': 0.10,
            'q4': 0.15,
            'annual': 0.20,
        },
    },

    // ============================================================================
    // PRICING FOR SPECIFIC FREIGHT TYPES
    // ============================================================================

    freightTypes: {
        general: {
            name: 'General Cargo',
            baseCost: 1.0, // Multiplier
            description: 'Standard freight',
        },
        hazmat: {
            name: 'Hazardous Materials',
            baseCost: 3.0,
            surcharge: 25.00,
            description: 'Class 3-9 hazmat with special handling',
            requirements: ['hazmat-certification', 'special-packaging'],
        },
        refrigerated: {
            name: 'Refrigerated/Cold Chain',
            baseCost: 2.0,
            surcharge: 20.00,
            description: 'Temperature-controlled transport',
            requirements: ['cold-chain-cert', 'monitoring'],
        },
        pharmaceutical: {
            name: 'Pharmaceutical',
            baseCost: 3.5,
            surcharge: 40.00,
            description: 'Regulated pharmaceutical transport',
            requirements: ['pharma-license', 'gxp-certified'],
        },
        food: {
            name: 'Food & Beverage',
            baseCost: 1.8,
            surcharge: 15.00,
            description: 'Food safety certified transport',
            requirements: ['food-cert', 'hygiene-trained'],
        },
        automotive: {
            name: 'Automotive Parts',
            baseCost: 1.5,
            surcharge: 10.00,
            description: 'Automotive components',
        },
        electronics: {
            name: 'Electronics & Sensitive',
            baseCost: 2.0,
            surcharge: 15.00,
            description: 'Anti-static, vibration controlled',
            requirements: ['esd-training'],
        },
        furniture: {
            name: 'Furniture & Large Items',
            baseCost: 1.5,
            surcharge: 12.00,
            description: 'White glove delivery available',
        },
        art: {
            name: 'Fine Art & Antiques',
            baseCost: 3.0,
            surcharge: 50.00,
            description: 'Museum-grade handling',
            requirements: ['art-handling-cert', 'insurance-required'],
        },
    },

    // ============================================================================
    // SERVICE LEVELS
    // ============================================================================

    serviceLevels: {
        standard: {
            name: 'Standard Delivery',
            estimatedDays: '5-7',
            baseCost: 1.0,
            surcharge: 0.00,
        },
        express: {
            name: 'Express Delivery',
            estimatedDays: '2-3',
            baseCost: 1.0,
            surcharge: 15.00,
        },
        nextDay: {
            name: 'Next Day Delivery',
            estimatedDays: '1',
            baseCost: 1.0,
            surcharge: 35.00,
        },
        sameDay: {
            name: 'Same Day Delivery',
            estimatedDays: 'same-day',
            baseCost: 1.0,
            surcharge: 75.00,
            availability: ['US-East', 'US-West', 'Germany', 'UK', 'Japan'],
        },
        scheduled: {
            name: 'Scheduled Delivery',
            estimatedDays: 'flexible',
            baseCost: 1.0,
            surcharge: 8.00,
        },
    },

    // ============================================================================
    // PAYMENT METHODS & TERMS
    // ============================================================================

    paymentTerms: {
        creditCard: {
            name: 'Credit Card',
            processingFee: 0.029, // 2.9%
            minFee: 0.30,
            supported: ['visa', 'mastercard', 'amex', 'discover'],
        },
        bankTransfer: {
            name: 'Bank Transfer (ACH)',
            processingFee: 0.01, // 1%
            minFee: 0.00,
            processing: '3-5 days',
            available: ['US', 'EU', 'UK'],
        },
        paypal: {
            name: 'PayPal',
            processingFee: 0.049, // 4.9% + $0.30
            minFee: 0.30,
        },
        stripe: {
            name: 'Stripe',
            processingFee: 0.029, // 2.9% + $0.30
            minFee: 0.30,
        },
        invoice: {
            name: 'Invoice (Net 30)',
            processingFee: 0.00,
            minAmount: 1000.00,
            creditCheck: true,
            available: ['enterprise', 'professional'],
        },
    },

    // ============================================================================
    // SUPPORT TIERS
    // ============================================================================

    supportTiers: {
        community: {
            name: 'Community Support',
            responseTime: '48 hours',
            channels: ['email', 'community-forum'],
            included: 'free',
        },
        email: {
            name: 'Email Support',
            responseTime: '24 hours',
            channels: ['email', 'ticket-system'],
            price: 0.00,
            included: ['starter', 'professional', 'enterprise'],
        },
        priority: {
            name: 'Priority Support',
            responseTime: '12 hours',
            channels: ['email', 'priority-phone', 'ticket-system'],
            price: 0.00,
            included: ['professional', 'enterprise'],
        },
        premium: {
            name: 'Premium 24/7 Support',
            responseTime: '2 hours',
            channels: ['phone', 'email', 'video-call', 'slack'],
            price: 299.00,
            interval: 'month',
            included: ['enterprise'],
        },
        dedicated: {
            name: 'Dedicated Account Manager',
            responseTime: '1 hour',
            channels: ['phone', 'email', 'video-call', 'slack', 'direct'],
            price: 999.00,
            interval: 'month',
            included: ['enterprise'],
        },
    },

    // ============================================================================
    // CURRENCY CONVERSION & EXCHANGE RATES (Updated Jan 2026)
    // ============================================================================

    exchangeRates: {
        'USD': 1.00,
        'EUR': 1.10,
        'GBP': 1.27,
        'JPY': 150.00,
        'AUD': 1.55,
        'CAD': 1.35,
        'CHF': 0.92,
        'CNY': 7.25,
        'INR': 83.00,
        'MXN': 17.00,
        'BRL': 5.00,
        'AED': 3.67,
        'SGD': 1.35,
        'HKD': 7.80,
        'KRW': 1300.00,
        'RUB': 100.00,
        'ZAR': 18.50,
        'NOK': 10.80,
        'SEK': 10.50,
        'DKK': 6.95,
    },

    // ============================================================================
    // PROMOTIONAL & SEASONAL PRICING
    // ============================================================================

    promotions: {
        newCustomer: {
            name: 'New Customer Discount',
            discount: 0.20, // 20% off
            duration: 30, // days
            minOrder: 50.00,
        },
        volumeCommitment: {
            name: 'Volume Commitment Discount',
            discount: 0.15, // 15% off
            minShipments: 100,
            period: 'month',
        },
        annualPlan: {
            name: 'Annual Plan Discount',
            discount: 0.20, // 20% off
            autoRenewal: true,
        },
        referral: {
            name: 'Referral Program',
            discount: 0.15, // 15% off referred customer
            credit: 50.00, // $50 credit for referrer
        },
        seasonal: {
            offseason: { discount: 0.25, months: ['June', 'July', 'August'] },
            peakseason: { surcharge: 0.30, months: ['November', 'December'] },
        },
    },
};

module.exports = WORLDWIDE_PRICING;
