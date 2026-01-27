/**
 * Bonus Engine Service
 * Calculates all bonuses, rewards, points, and loyalty benefits
 */

const BONUSES = require('../data/bonusesSystem');
const { REWARDS_TIERS, TIER_QUALIFICATION, POINTS_VALUE } = require('../data/rewardsTiers');

class BonusEngine {
    /**
     * Calculate referral bonus for new customer acquisition
     */
    async calculateReferralBonus(referralDetails) {
        const {
            type, // 'customer' or 'driver'
            referrerInfo,
            referredInfo,
            shipmentCount = 0,
        } = referralDetails;

        try {
            const result = {
                success: true,
                referralType: type,
                referrer: null,
                referred: null,
            };

            if (type === 'customer') {
                const customerRef = BONUSES.referralProgram.customerReferral;

                // Referrer bonus
                if (shipmentCount >= 1) {
                    result.referrer = {
                        bonus: customerRef.referrer.reward,
                        status: 'earned',
                        condition: customerRef.referrer.condition,
                    };
                }

                // Referred bonus
                result.referred = {
                    bonus: customerRef.referred.reward,
                    status: 'pending',
                    expiryDays: customerRef.referred.validityDays,
                    condition: customerRef.referred.condition,
                };

                // Check tier eligibility
                const referrerTier = referrerInfo?.loyaltyTier || 'bronze';
                const tierBonus = customerRef.tiers[referrerTier];
                if (tierBonus) {
                    result.referrer.tieredBonus = tierBonus.bonus;
                    result.referrer.monthlyAllocation = tierBonus.monthlyBonus;
                }
            } else if (type === 'driver') {
                const driverRef = BONUSES.referralProgram.driverReferral;

                result.referrer = {
                    baseBonus: driverRef.referrer.reward,
                    milestoneBonus100: driverRef.referrer.bonus100Shipments,
                    milestoneBonus500: driverRef.referrer.bonus500Shipments,
                    shipmentCount,
                };

                result.referred = {
                    signupBonus: driverRef.referred.signupBonus,
                    firstShipmentBonus: driverRef.referred.firstShipmentBonus,
                    tenthShipmentBonus: driverRef.referred.tenthShipmentBonus,
                };
            }

            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Calculate loyalty points earned
     */
    async calculateLoyaltyPoints(purchaseDetails) {
        const {
            amount = 0,
            customerId,
            loyaltyTier = 'bronze',
            isSubscriptionRenewal = false,
            promoCode = null,
        } = purchaseDetails;

        try {
            const tier = REWARDS_TIERS[loyaltyTier];
            if (!tier) {
                throw new Error(`Invalid loyalty tier: ${loyaltyTier}`);
            }

            const basePoints = amount * tier.earnings.pointsPerDollar;

            let totalPoints = basePoints;
            const breakdown = {
                basePoints,
                bonuses: {},
            };

            // Check for promotional point multipliers
            if (promoCode === 'DOUBLE_POINTS') {
                const bonusPoints = basePoints;
                breakdown.bonuses.promotional = bonusPoints;
                totalPoints += bonusPoints;
            }

            // Subscription renewal bonus (if applicable)
            if (isSubscriptionRenewal && tier.earnings.monthlyBonus) {
                breakdown.bonuses.monthly = tier.earnings.monthlyBonus;
                totalPoints += tier.earnings.monthlyBonus;
            }

            return {
                success: true,
                points: Math.floor(totalPoints),
                breakdown,
                value: Math.floor(totalPoints) * POINTS_VALUE.conversionRate,
                tier: loyaltyTier,
                expiryDate: this._getPointsExpiryDate(loyaltyTier),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Calculate driver performance bonuses
     */
    async calculateDriverPerformanceBonus(driverMetrics) {
        const {
            driverId,
            onTimePercentage = 0,
            averageRating = 0,
            monthlyShipments = 0,
            accidentsFreeMonths = 0,
            referralsCount = 0,
        } = driverMetrics;

        try {
            const bonuses = {
                success: true,
                driverId,
                totalBonus: 0,
                breakdown: {},
            };

            const perfBonus = BONUSES.driverPerformanceBonus;

            // On-time delivery bonus
            let onTimeBonus = 0;
            if (onTimePercentage >= 99) {
                onTimeBonus = perfBonus.deliveryAccuracy.metrics['99-100%'].bonus;
                bonuses.breakdown.onTimeDelivery = {
                    percentage: onTimePercentage,
                    bonus: onTimeBonus,
                };
            } else if (onTimePercentage >= 95) {
                onTimeBonus = perfBonus.deliveryAccuracy.metrics['95-98%'].bonus;
                bonuses.breakdown.onTimeDelivery = {
                    percentage: onTimePercentage,
                    bonus: onTimeBonus,
                };
            } else if (onTimePercentage >= 90) {
                onTimeBonus = perfBonus.deliveryAccuracy.metrics['90-94%'].bonus;
                bonuses.breakdown.onTimeDelivery = {
                    percentage: onTimePercentage,
                    bonus: onTimeBonus,
                };
            }

            // Customer rating bonus
            let ratingBonus = 0;
            if (averageRating >= 4.9) {
                ratingBonus = perfBonus.customerRatings.metrics['4.9-5.0'].bonus;
                bonuses.breakdown.customerRating = {
                    rating: averageRating,
                    bonus: ratingBonus,
                };
            } else if (averageRating >= 4.7) {
                ratingBonus = perfBonus.customerRatings.metrics['4.7-4.8'].bonus;
                bonuses.breakdown.customerRating = {
                    rating: averageRating,
                    bonus: ratingBonus,
                };
            }

            // Volume incentive bonus
            let volumeBonus = 0;
            let volumePercent = 0;
            for (const [range, metric] of Object.entries(perfBonus.volumeIncentive.metrics)) {
                const [min, max] = range.split('-').map(Number);
                if (max === null || monthlyShipments <= max) {
                    if (monthlyShipments >= min) {
                        volumeBonus = metric.bonus + (monthlyShipments * metric.percent);
                        volumePercent = metric.percent * 100;
                        break;
                    }
                }
            }

            if (volumeBonus > 0) {
                bonuses.breakdown.volumeIncentive = {
                    shipments: monthlyShipments,
                    bonus: volumeBonus,
                    percent: volumePercent,
                };
            }

            // Safety bonus
            let safetyBonus = 0;
            if (accidentsFreeMonths >= 12) {
                safetyBonus = perfBonus.safetyRecord.metrics.zeroAccidents_12months;
                bonuses.breakdown.safety = {
                    accidentsFreeMonths,
                    bonus: safetyBonus,
                };
            } else if (accidentsFreeMonths >= 6) {
                safetyBonus = perfBonus.safetyRecord.metrics.zeroAccidents_6months;
                bonuses.breakdown.safety = {
                    accidentsFreeMonths,
                    bonus: safetyBonus,
                };
            } else if (accidentsFreeMonths >= 3) {
                safetyBonus = perfBonus.safetyRecord.metrics.zeroAccidents_3months;
                bonuses.breakdown.safety = {
                    accidentsFreeMonths,
                    bonus: safetyBonus,
                };
            }

            // Referral bonus
            let referralBonus = referralsCount * perfBonus.referralBonus.perRecruit;
            if (referralsCount >= 100) {
                referralBonus += perfBonus.referralBonus.bonus100Recruits;
            } else if (referralsCount >= 50) {
                referralBonus += perfBonus.referralBonus.bonus50Recruits;
            }

            if (referralBonus > 0) {
                bonuses.breakdown.referrals = {
                    count: referralsCount,
                    bonus: referralBonus,
                };
            }

            bonuses.totalBonus = Math.round(
                onTimeBonus + ratingBonus + volumeBonus + safetyBonus + referralBonus
            );

            return bonuses;
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Calculate customer milestone bonuses
     */
    async calculateMilestoneBonus(customerStats) {
        const {
            customerId,
            totalShipments = 0,
            totalSpent = 0,
            accountAgeMonths = 0,
        } = customerStats;

        try {
            const bonuses = {
                success: true,
                customerId,
                unlockedMilestones: [],
                totalBonus: 0,
            };

            const milestones = BONUSES.customerMilestones;

            // Check shipment milestones
            for (const [shipCount, data] of Object.entries(milestones.shipmentMilestones)) {
                if (totalShipments >= parseInt(shipCount)) {
                    bonuses.unlockedMilestones.push({
                        type: 'shipment',
                        milestone: shipCount,
                        bonus: data.bonus,
                        description: data.description,
                    });
                    bonuses.totalBonus += data.bonus;
                }
            }

            // Check volume milestones
            for (const [volume, data] of Object.entries(milestones.volumeMilestones)) {
                if (totalSpent >= parseInt(volume)) {
                    bonuses.unlockedMilestones.push({
                        type: 'volume',
                        milestone: volume,
                        bonus: data.bonus,
                        description: data.description,
                    });
                    bonuses.totalBonus += data.bonus;
                }
            }

            // Check tenure milestones
            for (const [months, data] of Object.entries(milestones.tenure)) {
                const monthValue = parseInt(months) || (months === '5years' ? 60 : 0);
                if (accountAgeMonths >= monthValue) {
                    bonuses.unlockedMilestones.push({
                        type: 'tenure',
                        milestone: months,
                        bonus: data.bonus,
                        description: data.description,
                    });
                    bonuses.totalBonus += data.bonus;
                }
            }

            return bonuses;
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Calculate promotional bonuses based on active campaigns
     */
    async calculatePromotionalBonus(customerInfo) {
        const {
            customerId,
            isNewCustomer = false,
            loyaltyTier = 'bronze',
            currentDate = new Date(),
        } = customerInfo;

        try {
            const bonuses = {
                success: true,
                customerId,
                activePromotions: [],
                totalBonus: 0,
            };

            const promo = BONUSES.promotionalBonuses;
            const month = currentDate.getMonth() + 1;

            // Check promotions by season
            if (month === 1) {
                // January - New Year
                if (isNewCustomer) {
                    bonuses.activePromotions.push({
                        name: promo.newYearPromotion.name,
                        bonus: promo.newYearPromotion.bonus,
                        active: true,
                    });
                    bonuses.totalBonus += promo.newYearPromotion.bonus;
                }
            } else if (month >= 3 && month <= 4) {
                // March-April - Spring
                bonuses.activePromotions.push({
                    name: promo.springPromotion.name,
                    pointsMultiplier: promo.springPromotion.pointsMultiplier,
                    active: true,
                });
            } else if (month >= 6 && month <= 8) {
                // Summer
                bonuses.activePromotions.push({
                    name: promo.summerBonus.name,
                    volumeBonus: promo.summerBonus.volumeBonus,
                    active: true,
                });
            } else if (month >= 11 || month === 12) {
                // November-December - Holiday
                bonuses.activePromotions.push({
                    name: promo.holidayPromotion.name,
                    bonus: promo.holidayPromotion.bonus,
                    active: true,
                });
                bonuses.totalBonus += promo.holidayPromotion.bonus;
            }

            return bonuses;
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Calculate total bonus package for customer
     */
    async calculateTotalBonus(customerId, details) {
        try {
            const {
                loyalty,
                purchase,
                milestone,
                referral,
                performance,
                promotional,
            } = details;

            let totalBonus = 0;
            const components = {};

            // Loyalty points value
            if (loyalty) {
                const loyaltyResult = await this.calculateLoyaltyPoints(loyalty);
                if (loyaltyResult.success) {
                    components.loyalty = loyaltyResult.value;
                    totalBonus += loyaltyResult.value;
                }
            }

            // Milestone bonuses
            if (milestone) {
                const milestoneResult = await this.calculateMilestoneBonus(milestone);
                if (milestoneResult.success) {
                    components.milestone = milestoneResult.totalBonus;
                    totalBonus += milestoneResult.totalBonus;
                }
            }

            // Referral bonuses
            if (referral) {
                const referralResult = await this.calculateReferralBonus(referral);
                if (referralResult.success) {
                    components.referral = {
                        referrer: referralResult.referrer?.bonus || 0,
                        referred: referralResult.referred?.bonus || 0,
                    };
                    totalBonus += (components.referral.referrer + components.referral.referred);
                }
            }

            // Performance bonuses
            if (performance) {
                const perfResult = await this.calculateDriverPerformanceBonus(performance);
                if (perfResult.success) {
                    components.performance = perfResult.totalBonus;
                    totalBonus += perfResult.totalBonus;
                }
            }

            // Promotional bonuses
            if (promotional) {
                const promoResult = await this.calculatePromotionalBonus(promotional);
                if (promoResult.success) {
                    components.promotional = promoResult.totalBonus;
                    totalBonus += promoResult.totalBonus;
                }
            }

            return {
                success: true,
                customerId,
                totalBonus: Math.round(totalBonus * 100) / 100,
                components,
                currency: 'USD',
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Determine customer loyalty tier based on qualifications
     */
    async determineLoyaltyTier(customerStats) {
        const {
            points = 0,
            monthlySpend = 0,
            totalSpend = 0,
            shipmentCount = 0,
            accountAgeMonths = 0,
        } = customerStats;

        try {
            // Check Platinum first (highest tier)
            const platinumCriteria = TIER_QUALIFICATION.Platinum.criteria;
            let platinumMatch = true;
            for (const criterion of platinumCriteria) {
                if (criterion.points && points < criterion.points.min) platinumMatch = false;
                if (criterion.spend && totalSpend < criterion.spend.min) platinumMatch = false;
                if (criterion.shipments && shipmentCount < criterion.shipments.min) platinumMatch = false;
                if (criterion.monthsActive && accountAgeMonths < criterion.monthsActive.min) platinumMatch = false;
            }
            if (platinumMatch) {
                return { tier: 'platinum', qualifies: true };
            }

            // Check Gold
            const goldCriteria = TIER_QUALIFICATION.Gold.criteria;
            for (const criterion of goldCriteria) {
                if (criterion.points && points >= criterion.points.min) return { tier: 'gold', qualifies: true };
                if (criterion.spend && totalSpend >= criterion.spend.min) return { tier: 'gold', qualifies: true };
                if (criterion.shipments && shipmentCount >= criterion.shipments.min) return { tier: 'gold', qualifies: true };
            }

            // Check Silver
            const silverCriteria = TIER_QUALIFICATION.Silver.criteria;
            for (const criterion of silverCriteria) {
                if (criterion.points && points >= criterion.points.min) return { tier: 'silver', qualifies: true };
                if (criterion.spend && totalSpend >= criterion.spend.min) return { tier: 'silver', qualifies: true };
                if (criterion.shipments && shipmentCount >= criterion.shipments.min) return { tier: 'silver', qualifies: true };
            }

            // Default to Bronze
            return { tier: 'bronze', qualifies: true };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Helper: Get points expiry date based on tier
     */
    _getPointsExpiryDate(tier) {
        const tiers = {
            bronze: 12,
            silver: 18,
            gold: 24,
            platinum: 36,
        };

        const expiryMonths = tiers[tier] || 12;
        const date = new Date();
        date.setMonth(date.getMonth() + expiryMonths);
        return date;
    }

    /**
     * Validate bonus redemption request
     */
    async validateBonusRedemption(redemptionRequest) {
        const {
            bonusAmount,
            redemptionMethod,
            customerBalance,
            loyaltyTier = 'bronze',
        } = redemptionRequest;

        try {
            const rules = BONUSES.redemptionRules;
            const errors = [];

            if (bonusAmount < rules.minimumAmount) {
                errors.push(`Minimum redemption amount is $${rules.minimumAmount}`);
            }

            if (bonusAmount > rules.maximumPerTransaction) {
                errors.push(`Maximum redemption per transaction is $${rules.maximumPerTransaction}`);
            }

            if (bonusAmount > customerBalance) {
                errors.push('Insufficient bonus balance');
            }

            if (!rules.methods[redemptionMethod]) {
                errors.push(`Invalid redemption method: ${redemptionMethod}`);
            }

            return {
                valid: errors.length === 0,
                errors,
                redemptionValue: bonusAmount * (rules.methods[redemptionMethod]?.conversionRate || 1),
            };
        } catch (error) {
            return {
                valid: false,
                errors: [error.message],
            };
        }
    }
}

module.exports = BonusEngine;
