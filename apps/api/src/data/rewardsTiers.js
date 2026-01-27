/**
 * Rewards Tiers Configuration - 2026 Edition
 * Structured loyalty tier system with earning rates and benefits
 */

const REWARDS_TIERS = {
    /**
     * BRONZE TIER - Entry Level
     * Free tier for all new customers
     */
    bronze: {
        id: 'tier_bronze',
        name: 'Bronze',
        level: 1,
        color: '#CD7F32',

        requirements: {
            minPoints: 0,
            minMonthlyShipments: 0,
            annualSpendMin: 0,
            autoQualify: 'newCustomer',
        },

        earnings: {
            pointsPerDollar: 1.0,
            monthlyBonus: 0,
            referralBonus: 50.00,
            referralPoints: 500,
        },

        benefits: {
            pointsMultiplier: 1.0,
            shippingDiscount: 0,
            expressShippingDiscount: 0,
            insuranceDiscount: 0,

            features: [
                'Earn 1 point per $1 spent',
                'Birthday bonus: 50 points',
                'Welcome email newsletter',
                'Access to public sales',
                'Basic tracking',
            ],

            support: {
                tier: 'email',
                responseTime: '24-48 hours',
                chatAvailable: false,
            },

            addOns: {
                freeInsurance: false,
                freeSignature: false,
                freePhotos: false,
            },
        },

        limits: {
            maxRedemptionPerMonth: 500,
            maxBonusesPerMonth: 0,
            pointsExpiry: 12, // months
        },

        upgradePath: {
            nextTier: 'silver',
            pointsNeeded: 1000,
            spendNeeded: 500,
            shipmentsNeeded: 25,
        },
    },

    /**
     * SILVER TIER - Engaged Customers
     * For customers reaching 1,000 points or spending $500+
     */
    silver: {
        id: 'tier_silver',
        name: 'Silver',
        level: 2,
        color: '#C0C0C0',

        requirements: {
            minPoints: 1000,
            minMonthlyShipments: 2,
            annualSpendMin: 500,
            monthsActive: 3,
        },

        earnings: {
            pointsPerDollar: 1.25,
            monthlyBonus: 100,
            quarterlyBonus: 250,
            referralBonus: 75.00,
            referralPoints: 750,
        },

        benefits: {
            pointsMultiplier: 1.25,
            shippingDiscount: 0.05, // 5%
            expressShippingDiscount: 0.10, // 10%
            insuranceDiscount: 0.10, // 10%

            features: [
                'Earn 1.25 points per $1 spent',
                'Monthly 100 bonus points',
                'Quarterly 250 bonus points',
                'Birthday bonus: 100 points',
                '5% discount on standard shipping',
                'Priority customer support',
                'Free tracking enhancements',
                'Monthly exclusive offers',
                'Early access to seasonal promotions',
            ],

            support: {
                tier: 'email + chat',
                responseTime: '12-24 hours',
                chatAvailable: true,
                chatHours: '9AM-5PM EST',
            },

            addOns: {
                freeInsurance: false,
                freeSignature: false,
                freePhotos: false,
                monthlyFreeShipment: false,
            },

            freeServices: {
                trackingUpgrades: 'included',
                notificationServices: 'included',
            },
        },

        limits: {
            maxRedemptionPerMonth: 1000,
            maxBonusesPerMonth: 250,
            pointsExpiry: 18, // months
        },

        upgradePath: {
            nextTier: 'gold',
            pointsNeeded: 5000,
            spendNeeded: 2500,
            shipmentsNeeded: 100,
        },
    },

    /**
     * GOLD TIER - Loyal Customers
     * For customers reaching 5,000 points or spending $2,500+
     */
    gold: {
        id: 'tier_gold',
        name: 'Gold',
        level: 3,
        color: '#FFD700',

        requirements: {
            minPoints: 5000,
            minMonthlyShipments: 10,
            annualSpendMin: 2500,
            monthsActive: 12,
        },

        earnings: {
            pointsPerDollar: 1.50,
            monthlyBonus: 250,
            quarterlyBonus: 500,
            annualBonus: 2000,
            referralBonus: 100.00,
            referralPoints: 1000,
        },

        benefits: {
            pointsMultiplier: 1.50,
            shippingDiscount: 0.10, // 10%
            expressShippingDiscount: 0.15, // 15%
            insuranceDiscount: 0.20, // 20%

            features: [
                'Earn 1.5 points per $1 spent',
                'Monthly 250 bonus points',
                'Quarterly 500 bonus points',
                'Annual 2,000 bonus points',
                'Birthday bonus: 250 points',
                '10% discount on all standard shipments',
                '15% discount on express shipping',
                '20% discount on insurance',
                'Free signature on delivery',
                'Free photo documentation',
                'Free delivery notifications',
                'Dedicated account support',
                'Priority phone support',
                'Quarterly business review',
                'Exclusive VIP events',
                'Early access to new features',
                'Custom reporting available',
            ],

            support: {
                tier: 'premium',
                responseTime: '4-8 hours',
                phone: true,
                phoneHours: '8AM-6PM EST',
                email: true,
                chat: true,
            },

            addOns: {
                freeInsurance: false,
                freeSignature: true,
                freePhotos: true,
                monthlyFreeShipment: 1,
                freeExpressShipment: 1,
            },

            freeServices: {
                trackingUpgrades: 'included',
                notificationServices: 'included',
                customAlerts: 'included',
                APIAccess: 'included',
            },
        },

        limits: {
            maxRedemptionPerMonth: 2500,
            maxBonusesPerMonth: 750,
            pointsExpiry: 24, // months
        },

        upgradePath: {
            nextTier: 'platinum',
            pointsNeeded: 10000,
            spendNeeded: 7500,
            shipmentsNeeded: 300,
        },
    },

    /**
     * PLATINUM TIER - Elite Customers
     * For customers reaching 10,000 points or spending $7,500+
     */
    platinum: {
        id: 'tier_platinum',
        name: 'Platinum',
        level: 4,
        color: '#E5E4E2',

        requirements: {
            minPoints: 10000,
            minMonthlyShipments: 25,
            annualSpendMin: 7500,
            monthsActive: 24,
        },

        earnings: {
            pointsPerDollar: 2.0,
            monthlyBonus: 500,
            quarterlyBonus: 1000,
            annualBonus: 5000,
            referralBonus: 150.00,
            referralPoints: 1500,
        },

        benefits: {
            pointsMultiplier: 2.0,
            shippingDiscount: 0.15, // 15%
            expressShippingDiscount: 0.25, // 25%
            insuranceDiscount: 0.30, // 30%

            features: [
                'Earn 2 points per $1 spent',
                'Monthly 500 bonus points',
                'Quarterly 1,000 bonus points',
                'Annual 5,000 bonus points',
                'Birthday bonus: 500 points',
                '15% discount on all standard shipments',
                '25% discount on express shipping',
                '30% discount on insurance',
                'Unlimited free signatures',
                'Unlimited free photo documentation',
                'Unlimited free delivery notifications',
                'Dedicated account manager',
                '24/7 priority phone support',
                'Monthly business review',
                'Quarterly strategy sessions',
                'Private invitation-only events',
                'Beta access to new features',
                'Custom reporting and analytics',
                'White-glove service',
                'Personal logistics consultant',
                '$1,000 annual account credit',
            ],

            support: {
                tier: 'concierge',
                responseTime: 'immediate',
                phone: true,
                phoneHours: '24/7',
                email: true,
                chat: true,
                dedicated: true,
                dedicatedManager: true,
            },

            addOns: {
                freeInsurance: true,
                freeSignature: true,
                freePhotos: true,
                monthlyFreeShipment: 3,
                freeExpressShipment: 2,
            },

            freeServices: {
                trackingUpgrades: 'included',
                notificationServices: 'included',
                customAlerts: 'included',
                APIAccess: 'included',
                webhooks: 'included',
                customIntegrations: 'included',
            },
        },

        perks: {
            annualCredit: 1000.00,
            anniversaryBonus: 500.00,
            referralCap: 'unlimited',
        },

        limits: {
            maxRedemptionPerMonth: 5000,
            maxBonusesPerMonth: 1500,
            pointsExpiry: 36, // months
        },

        specialBenefits: {
            customPricing: 'available',
            volumeCommitmentDiscount: 'available',
            dedicatedIntegrationSupport: 'included',
            customReporting: 'included',
        },
    },
};

/**
 * TIER QUALIFICATION RULES
 */
const TIER_QUALIFICATION = {
    Bronze: {
        automatic: true,
        criteria: ['newAccount'],
        statusCheckFrequency: 'manual',
    },

    Silver: {
        automatic: true,
        criteria: [
            { points: { min: 1000 } },
            { spend: { min: 500 } },
            { shipments: { min: 25 } },
        ],
        requireAll: false, // need only one condition
        statusCheckFrequency: 'daily',
    },

    Gold: {
        automatic: true,
        criteria: [
            { points: { min: 5000 } },
            { spend: { min: 2500 } },
            { shipments: { min: 100 } },
            { monthsActive: { min: 12 } },
        ],
        requireAll: false,
        statusCheckFrequency: 'daily',
    },

    Platinum: {
        automatic: true,
        criteria: [
            { points: { min: 10000 } },
            { spend: { min: 7500 } },
            { shipments: { min: 300 } },
            { monthsActive: { min: 24 } },
        ],
        requireAll: true, // must meet ALL conditions
        statusCheckFrequency: 'daily',
        manualReview: true,
    },
};

/**
 * TIER DOWNGRADE RULES
 */
const TIER_DOWNGRADE = {
    enabled: true,

    Silver: {
        downgradeTo: 'Bronze',
        conditions: [
            { inactiveDays: 180 },
            { pointsBelowThreshold: { min: 500 } },
            { monthlyShipmentsBelow: 1 },
        ],
        warningPeriod: 30, // days
        graceMonths: 3,
    },

    Gold: {
        downgradeTo: 'Silver',
        conditions: [
            { inactiveDays: 180 },
            { pointsBelowThreshold: { min: 2500 } },
            { monthlyShipmentsBelow: 5 },
        ],
        warningPeriod: 30,
        graceMonths: 3,
    },

    Platinum: {
        downgradeTo: 'Gold',
        conditions: [
            { inactiveDays: 180 },
            { pointsBelowThreshold: { min: 5000 } },
            { monthlyShipmentsBelow: 15 },
        ],
        warningPeriod: 60,
        graceMonths: 6,
    },
};

/**
 * POINTS CONVERSION REFERENCE
 */
const POINTS_VALUE = {
    conversionRate: 0.05, // $0.05 per point

    redemptions: {
        1000: { value: 50.00, type: 'credit' },
        2500: { value: 125.00, type: 'credit' },
        5000: { value: 250.00, type: 'credit' },
        10000: { value: 500.00, type: 'credit' },
    },
};

module.exports = {
    REWARDS_TIERS,
    TIER_QUALIFICATION,
    TIER_DOWNGRADE,
    POINTS_VALUE,
};
