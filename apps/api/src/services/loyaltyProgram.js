/**
 * Loyalty Program Service
 * Manages customer loyalty tier tracking, point accumulation, and rewards
 */

const { REWARDS_TIERS, TIER_QUALIFICATION, TIER_DOWNGRADE } = require('../data/rewardsTiers');
const BONUSES = require('../data/bonusesSystem');

class LoyaltyProgram {
    constructor() {
        this.tiers = REWARDS_TIERS;
        this.qualification = TIER_QUALIFICATION;
        this.downgrade = TIER_DOWNGRADE;
    }

    /**
     * Enroll customer in loyalty program
     */
    async enrollCustomer(customerId, initialTier = 'bronze') {
        try {
            const tier = this.tiers[initialTier];
            if (!tier) {
                throw new Error(`Invalid tier: ${initialTier}`);
            }

            return {
                success: true,
                customerId,
                tier: initialTier,
                enrollmentDate: new Date(),
                initialBenefits: tier.benefits,
                pointsBalance: 0,
                status: 'active',
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Track customer activity and update points
     */
    async recordActivity(customerId, activity) {
        const {
            type, // 'shipment', 'purchase', 'referral', 'review'
            amount = 0,
            currentTier = 'bronze',
            date = new Date(),
        } = activity;

        try {
            const tier = this.tiers[currentTier];
            let pointsEarned = 0;
            let bonusAmount = 0;

            switch (type) {
                case 'shipment':
                    pointsEarned = Math.floor(amount * tier.earnings.pointsPerDollar);
                    break;

                case 'purchase':
                    pointsEarned = Math.floor(amount * tier.earnings.pointsPerDollar);
                    break;

                case 'referral':
                    pointsEarned = tier.earnings.referralPoints || 0;
                    bonusAmount = tier.earnings.referralBonus || 0;
                    break;

                case 'review':
                    pointsEarned = BONUSES.partnershipBonuses.socialMedia.review.bonus * 100;
                    break;

                default:
                    throw new Error(`Unknown activity type: ${type}`);
            }

            return {
                success: true,
                customerId,
                activityType: type,
                pointsEarned,
                bonusEarned: bonusAmount,
                newPointsBalance: pointsEarned,
                timestamp: date,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Check if customer qualifies for tier upgrade
     */
    async checkTierUpgrade(customerStats) {
        const {
            customerId,
            currentTier = 'bronze',
            points = 0,
            monthlySpend = 0,
            totalSpend = 0,
            shipmentCount = 0,
            accountAgeMonths = 0,
        } = customerStats;

        try {
            const tierProgression = ['bronze', 'silver', 'gold', 'platinum'];
            const currentIndex = tierProgression.indexOf(currentTier);

            // Check each tier from current + 1 upward
            for (let i = currentIndex + 1; i < tierProgression.length; i++) {
                const nextTier = tierProgression[i];
                const qualification = this.qualification[nextTier];

                if (!qualification) continue;

                let meetsRequirements = qualification.requireAll || false;
                let matchCount = 0;
                const totalCriteria = qualification.criteria.length;

                for (const criterion of qualification.criteria) {
                    let matches = true;

                    if (criterion.points && points >= criterion.points.min) {
                        matchCount++;
                    } else if (criterion.points) {
                        matches = false;
                    }

                    if (criterion.spend && totalSpend >= criterion.spend.min) {
                        matchCount++;
                    } else if (criterion.spend) {
                        matches = false;
                    }

                    if (criterion.shipments && shipmentCount >= criterion.shipments.min) {
                        matchCount++;
                    } else if (criterion.shipments) {
                        matches = false;
                    }

                    if (criterion.monthsActive && accountAgeMonths >= criterion.monthsActive.min) {
                        matchCount++;
                    } else if (criterion.monthsActive) {
                        matches = false;
                    }

                    if (criterion.monthlyShipments && monthlySpend >= criterion.monthlyShipments.min) {
                        matchCount++;
                    } else if (criterion.monthlyShipments) {
                        matches = false;
                    }
                }

                if (qualification.requireAll) {
                    meetsRequirements = matchCount === totalCriteria;
                } else {
                    meetsRequirements = matchCount > 0;
                }

                if (meetsRequirements) {
                    return {
                        success: true,
                        customerId,
                        currentTier,
                        nextTier,
                        eligible: true,
                        upgradeDate: new Date(),
                    };
                }
            }

            return {
                success: true,
                customerId,
                currentTier,
                eligible: false,
                nextTier: null,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Check if customer should be downgraded
     */
    async checkTierDowngrade(customerStats) {
        const {
            customerId,
            currentTier = 'silver',
            lastActivityDays = 0,
            monthlyShipments = 0,
            points = 0,
        } = customerStats;

        try {
            if (currentTier === 'bronze' || !this.downgrade[currentTier]) {
                return {
                    success: true,
                    customerId,
                    currentTier,
                    downgradeEligible: false,
                };
            }

            const downgradeRules = this.downgrade[currentTier];
            const downgradeTo = downgradeRules.downgradeTo;

            let shouldDowngrade = false;
            const reasons = [];

            // Check conditions
            for (const condition of downgradeRules.conditions) {
                if (condition.inactiveDays && lastActivityDays >= condition.inactiveDays) {
                    shouldDowngrade = true;
                    reasons.push(`Inactive for ${lastActivityDays} days`);
                }

                if (condition.pointsBelowThreshold && points < condition.pointsBelowThreshold.min) {
                    shouldDowngrade = true;
                    reasons.push(`Points below threshold: ${points}`);
                }

                if (condition.monthlyShipmentsBelow && monthlyShipments < condition.monthlyShipmentsBelow) {
                    shouldDowngrade = true;
                    reasons.push(`Monthly shipments below: ${monthlyShipments}`);
                }
            }

            if (shouldDowngrade) {
                return {
                    success: true,
                    customerId,
                    currentTier,
                    downgradeEligible: true,
                    downgradeTo,
                    reasons,
                    warningPeriodDays: downgradeRules.warningPeriod,
                    gracePeriodMonths: downgradeRules.graceMonths,
                };
            }

            return {
                success: true,
                customerId,
                currentTier,
                downgradeEligible: false,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get comprehensive tier benefits summary
     */
    async getTierBenefits(tier) {
        try {
            const tierInfo = this.tiers[tier];
            if (!tierInfo) {
                throw new Error(`Invalid tier: ${tier}`);
            }

            return {
                success: true,
                tier,
                benefits: tierInfo.benefits,
                earnings: tierInfo.earnings,
                limits: tierInfo.limits,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Calculate monthly bonus points for tier
     */
    async calculateMonthlyBonus(currentTier) {
        try {
            const tier = this.tiers[currentTier];
            if (!tier) {
                throw new Error(`Invalid tier: ${currentTier}`);
            }

            const monthlyBonus = tier.earnings.monthlyBonus || 0;
            const quarterlyBonus = tier.earnings.quarterlyBonus || 0;
            const annualBonus = tier.earnings.annualBonus || 0;

            return {
                success: true,
                tier: currentTier,
                monthlyBonus,
                quarterlyBonus,
                annualBonus,
                nextBonusDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Process loyalty points redemption
     */
    async redeemPoints(customerId, redemptionRequest) {
        const {
            pointsToRedeem = 0,
            method = 'accountCredit',
            currentPointsBalance = 0,
            currentTier = 'bronze',
        } = redemptionRequest;

        try {
            const tier = this.tiers[currentTier];
            if (!tier) {
                throw new Error(`Invalid tier: ${currentTier}`);
            }

            if (pointsToRedeem > currentPointsBalance) {
                throw new Error('Insufficient points balance');
            }

            const redemptionRules = BONUSES.redemptionRules;
            const methodInfo = redemptionRules.methods[method];

            if (!methodInfo) {
                throw new Error(`Invalid redemption method: ${method}`);
            }

            const creditValue = pointsToRedeem * methodInfo.conversionRate;

            return {
                success: true,
                customerId,
                pointsRedeemed: pointsToRedeem,
                method,
                creditValue: Math.round(creditValue * 100) / 100,
                newPointsBalance: currentPointsBalance - pointsToRedeem,
                processingTime: methodInfo.processingTime || 'immediate',
                timestamp: new Date(),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get tier upgrade path and progress
     */
    async getTierUpgradeProgress(customerStats) {
        const {
            customerId,
            currentTier = 'bronze',
            points = 0,
            totalSpend = 0,
            shipmentCount = 0,
            accountAgeMonths = 0,
        } = customerStats;

        try {
            const tier = this.tiers[currentTier];
            const upgradePath = tier.upgradePath;

            if (!upgradePath) {
                return {
                    success: true,
                    customerId,
                    currentTier,
                    message: 'Platinum tier - maximum level reached',
                };
            }

            const nextTier = upgradePath.nextTier;
            const nextTierInfo = this.tiers[nextTier];

            const progress = {
                success: true,
                customerId,
                currentTier,
                nextTier,
                progress: {
                    points: {
                        current: points,
                        required: upgradePath.pointsNeeded,
                        percentComplete: Math.min(100, Math.round((points / upgradePath.pointsNeeded) * 100)),
                    },
                    spend: {
                        current: totalSpend,
                        required: upgradePath.spendNeeded,
                        percentComplete: Math.min(100, Math.round((totalSpend / upgradePath.spendNeeded) * 100)),
                    },
                    shipments: {
                        current: shipmentCount,
                        required: upgradePath.shipmentsNeeded,
                        percentComplete: Math.min(100, Math.round((shipmentCount / upgradePath.shipmentsNeeded) * 100)),
                    },
                },
                nextTierBenefits: nextTierInfo.benefits,
            };

            return progress;
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Generate loyalty status report for customer
     */
    async generateLoyaltyReport(customerId, customerData) {
        const {
            currentTier = 'bronze',
            points = 0,
            pointsBalance = 0,
            lifetimeSpend = 0,
            totalShipments = 0,
            membershipMonths = 0,
            recentActivityDays = 0,
        } = customerData;

        try {
            const tier = this.tiers[currentTier];
            const monthlyBonus = await this.calculateMonthlyBonus(currentTier);
            const upgradeProgress = await this.getTierUpgradeProgress({
                customerId,
                currentTier,
                points,
                totalSpend: lifetimeSpend,
                shipmentCount: totalShipments,
                accountAgeMonths: membershipMonths,
            });

            const report = {
                success: true,
                customerId,
                generatedDate: new Date(),
                tierStatus: {
                    currentTier,
                    level: tier.level,
                    color: tier.color,
                    membershipMonths,
                },
                pointsStatus: {
                    balance: pointsBalance,
                    earned: points,
                    expiryDate: this._calculateExpiryDate(currentTier, points),
                },
                activity: {
                    lifetimeSpend,
                    totalShipments,
                    lastActivityDays: recentActivityDays,
                    status: recentActivityDays < 30 ? 'Active' : 'Inactive',
                },
                monthlyBonuses: monthlyBonus,
                upgradeProgress: upgradeProgress.progress || {},
                benefits: tier.benefits,
                recommendations: this._generateRecommendations(currentTier, recentActivityDays, pointsBalance),
            };

            return report;
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Helper: Calculate points expiry date
     */
    _calculateExpiryDate(tier, points) {
        const expiryMonths = this.tiers[tier]?.limits.pointsExpiry || 12;
        const date = new Date();
        date.setMonth(date.getMonth() + expiryMonths);
        return date;
    }

    /**
     * Helper: Generate personalized recommendations
     */
    _generateRecommendations(tier, inactiveDays, pointsBalance) {
        const recommendations = [];

        // Activity recommendations
        if (inactiveDays > 60) {
            recommendations.push({
                type: 'activity',
                message: 'You have not shipped in 60+ days. Welcome back with 50 bonus points on your next shipment!',
                bonus: 50,
            });
        }

        // Points recommendations
        if (pointsBalance > 1000) {
            recommendations.push({
                type: 'redemption',
                message: 'You have enough points to redeem! $50+ in value available.',
                value: Math.floor((pointsBalance * 0.05)),
            });
        }

        // Tier upgrade recommendations
        if (tier !== 'platinum') {
            recommendations.push({
                type: 'upgrade',
                message: `Continue shipping to reach ${tier === 'bronze' ? 'Silver' : tier === 'silver' ? 'Gold' : 'Platinum'} tier!`,
            });
        }

        return recommendations;
    }
}

module.exports = LoyaltyProgram;
