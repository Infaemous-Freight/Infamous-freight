/**
 * Bonus System - Integration Tests
 * Comprehensive test suite for bonus and rewards functionality
 */

const BonusEngine = require('../services/bonusEngine');
const LoyaltyProgram = require('../services/loyaltyProgram');

describe('Bonus System Integration Tests', () => {
    let bonusEngine;
    let loyaltyProgram;

    beforeAll(() => {
        bonusEngine = new BonusEngine();
        loyaltyProgram = new LoyaltyProgram();
    });

    // ============================================================================
    // REFERRAL BONUS TESTS
    // ============================================================================

    describe('Referral Bonus Calculations', () => {
        test('should calculate customer referral bonus correctly', async () => {
            const result = await bonusEngine.calculateReferralBonus({
                type: 'customer',
                referrerInfo: { loyaltyTier: 'silver' },
                shipmentCount: 1,
            });

            expect(result.success).toBe(true);
            expect(result.referrer).toBeDefined();
            expect(result.referrer.bonus).toBe(75.00); // Silver tier bonus
        });

        test('should calculate driver referral bonus with milestones', async () => {
            const result = await bonusEngine.calculateReferralBonus({
                type: 'driver',
                referrerInfo: {},
                shipmentCount: 100,
            });

            expect(result.success).toBe(true);
            expect(result.referrer.baseBonus).toBe(100.00);
            expect(result.referrer.milestoneBonus100).toBe(250.00);
        });

        test('should apply tier-based multipliers for customer referrals', async () => {
            const tiers = ['bronze', 'silver', 'gold', 'platinum'];
            const expectedBonuses = [50.00, 75.00, 100.00, 150.00];

            for (let i = 0; i < tiers.length; i++) {
                const result = await bonusEngine.calculateReferralBonus({
                    type: 'customer',
                    referrerInfo: { loyaltyTier: tiers[i] },
                    shipmentCount: 1,
                });

                expect(result.referrer.tieredBonus).toBe(expectedBonuses[i]);
            }
        });

        test('should respect monthly referral bonus caps', async () => {
            const result = await bonusEngine.calculateReferralBonus({
                type: 'customer',
                referrerInfo: { loyaltyTier: 'platinum' },
                shipmentCount: 50, // Multiple referrals
            });

            expect(result.success).toBe(true);
            // Cap should be $5,000/month
            expect(result.referrer.monthlyAllocation).toBeLessThanOrEqual(5000.00);
        });
    });

    // ============================================================================
    // LOYALTY POINTS TESTS
    // ============================================================================

    describe('Loyalty Points Calculations', () => {
        test('should calculate points based on tier multiplier', async () => {
            const result = await bonusEngine.calculateLoyaltyPoints({
                amount: 100.00,
                customerId: 'cust_test1',
                loyaltyTier: 'silver',
            });

            expect(result.success).toBe(true);
            expect(result.points).toBe(125); // 100 * 1.25
            expect(result.value).toBe(6.25); // 125 * 0.05
        });

        test('should include monthly bonuses for eligible tiers', async () => {
            const result = await bonusEngine.calculateLoyaltyPoints({
                amount: 100.00,
                customerId: 'cust_test2',
                loyaltyTier: 'gold',
                isSubscriptionRenewal: true,
            });

            expect(result.success).toBe(true);
            expect(result.breakdown.bonuses.monthly).toBe(250);
        });

        test('should apply promotional multipliers', async () => {
            const result = await bonusEngine.calculateLoyaltyPoints({
                amount: 100.00,
                customerId: 'cust_test3',
                loyaltyTier: 'bronze',
                promoCode: 'DOUBLE_POINTS',
            });

            expect(result.success).toBe(true);
            expect(result.breakdown.bonuses.promotional).toBe(100);
        });

        test('should set correct points expiry date by tier', async () => {
            const tiers = ['bronze', 'silver', 'gold', 'platinum'];
            const expiryMonths = [12, 18, 24, 36];

            for (let i = 0; i < tiers.length; i++) {
                const result = await bonusEngine.calculateLoyaltyPoints({
                    amount: 50.00,
                    customerId: `cust_${tiers[i]}`,
                    loyaltyTier: tiers[i],
                });

                const expiryTime = result.expiryDate.getTime() - Date.now();
                const expectedTime = expiryMonths[i] * 30 * 24 * 60 * 60 * 1000;

                // Allow 1 day variance
                expect(Math.abs(expiryTime - expectedTime)).toBeLessThan(24 * 60 * 60 * 1000);
            }
        });
    });

    // ============================================================================
    // DRIVER PERFORMANCE TESTS
    // ============================================================================

    describe('Driver Performance Bonuses', () => {
        test('should calculate on-time delivery bonus', async () => {
            const result = await bonusEngine.calculateDriverPerformanceBonus({
                driverId: 'drv_test1',
                onTimePercentage: 99.5,
                averageRating: 4.0,
                monthlyShipments: 100,
            });

            expect(result.success).toBe(true);
            expect(result.breakdown.onTimeDelivery).toBeDefined();
            expect(result.breakdown.onTimeDelivery.bonus).toBe(500.00);
        });

        test('should calculate customer satisfaction bonus', async () => {
            const result = await bonusEngine.calculateDriverPerformanceBonus({
                driverId: 'drv_test2',
                averageRating: 4.95,
            });

            expect(result.success).toBe(true);
            expect(result.breakdown.customerRating.bonus).toBe(300.00);
        });

        test('should calculate volume incentive bonus', async () => {
            const result = await bonusEngine.calculateDriverPerformanceBonus({
                driverId: 'drv_test3',
                monthlyShipments: 750,
            });

            expect(result.success).toBe(true);
            expect(result.breakdown.volumeIncentive).toBeDefined();
            expect(result.breakdown.volumeIncentive.bonus).toBeGreaterThan(0);
        });

        test('should award safety bonuses for accident-free records', async () => {
            const result = await bonusEngine.calculateDriverPerformanceBonus({
                driverId: 'drv_test4',
                accidentsFreeMonths: 12,
            });

            expect(result.success).toBe(true);
            expect(result.breakdown.safety.bonus).toBe(2000.00);
        });

        test('should aggregate all performance metrics', async () => {
            const result = await bonusEngine.calculateDriverPerformanceBonus({
                driverId: 'drv_test5',
                onTimePercentage: 98,
                averageRating: 4.8,
                monthlyShipments: 500,
                accidentsFreeMonths: 6,
                referralsCount: 3,
            });

            expect(result.success).toBe(true);
            expect(result.totalBonus).toBeGreaterThan(0);
            expect(result.breakdown.onTimeDelivery).toBeDefined();
            expect(result.breakdown.customerRating).toBeDefined();
            expect(result.breakdown.volumeIncentive).toBeDefined();
        });
    });

    // ============================================================================
    // MILESTONE TESTS
    // ============================================================================

    describe('Milestone Bonuses', () => {
        test('should detect shipment milestones', async () => {
            const result = await bonusEngine.calculateMilestoneBonus({
                customerId: 'cust_test_milestone1',
                totalShipments: 250,
            });

            expect(result.success).toBe(true);
            expect(result.unlockedMilestones.length).toBeGreaterThan(0);
            expect(result.unlockedMilestones.some(m => m.type === 'shipment')).toBe(true);
        });

        test('should detect volume milestones', async () => {
            const result = await bonusEngine.calculateMilestoneBonus({
                customerId: 'cust_test_milestone2',
                totalSpent: 5000,
            });

            expect(result.success).toBe(true);
            expect(result.unlockedMilestones.some(m => m.type === 'volume')).toBe(true);
        });

        test('should detect tenure milestones', async () => {
            const result = await bonusEngine.calculateMilestoneBonus({
                customerId: 'cust_test_milestone3',
                accountAgeMonths: 12,
            });

            expect(result.success).toBe(true);
            expect(result.unlockedMilestones.some(m => m.type === 'tenure')).toBe(true);
        });

        test('should accumulate bonus totals correctly', async () => {
            const result = await bonusEngine.calculateMilestoneBonus({
                customerId: 'cust_test_milestone4',
                totalShipments: 500,
                totalSpent: 10000,
                accountAgeMonths: 24,
            });

            expect(result.success).toBe(true);
            expect(result.totalBonus).toBeGreaterThan(1000);
        });
    });

    // ============================================================================
    // LOYALTY TIER TESTS
    // ============================================================================

    describe('Loyalty Tier Management', () => {
        test('should enroll customer in Bronze tier', async () => {
            const result = await loyaltyProgram.enrollCustomer('cust_test_enroll', 'bronze');

            expect(result.success).toBe(true);
            expect(result.tier).toBe('bronze');
            expect(result.pointsBalance).toBe(0);
            expect(result.status).toBe('active');
        });

        test('should determine correct tier based on qualifications', async () => {
            const result = await bonusEngine.determineLoyaltyTier({
                points: 5500,
                totalSpend: 2500,
                shipmentCount: 100,
                accountAgeMonths: 12,
            });

            expect(result.qualifies).toBe(true);
            expect(result.tier).toBe('gold');
        });

        test('should handle tier upgrades', async () => {
            const result = await loyaltyProgram.checkTierUpgrade({
                customerId: 'cust_test_upgrade',
                currentTier: 'silver',
                points: 5500,
                totalSpend: 2500,
                shipmentCount: 100,
            });

            expect(result.success).toBe(true);
            expect(result.eligible).toBe(true);
            expect(result.nextTier).toBe('gold');
        });

        test('should detect tier downgrade conditions', async () => {
            const result = await loyaltyProgram.checkTierDowngrade({
                customerId: 'cust_test_downgrade',
                currentTier: 'gold',
                lastActivityDays: 200, // Inactive for 200 days
                monthlyShipments: 2,
                points: 2000, // Below threshold
            });

            expect(result.success).toBe(true);
            expect(result.downgradeEligible).toBe(true);
        });
    });

    // ============================================================================
    // POINTS REDEMPTION TESTS
    // ============================================================================

    describe('Points Redemption', () => {
        test('should validate redemption request', async () => {
            const result = await bonusEngine.validateBonusRedemption({
                bonusAmount: 50,
                redemptionMethod: 'accountCredit',
                customerBalance: 100,
                loyaltyTier: 'bronze',
            });

            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        test('should reject redemption below minimum amount', async () => {
            const result = await bonusEngine.validateBonusRedemption({
                bonusAmount: 2,
                redemptionMethod: 'accountCredit',
                customerBalance: 100,
            });

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('should apply redemption method conversion rates', async () => {
            const methods = ['accountCredit', 'freeShipment', 'discountCode', 'cashback'];
            const expected = [1.0, 0.5, 0.8, 0.75];

            for (let i = 0; i < methods.length; i++) {
                const result = await bonusEngine.validateBonusRedemption({
                    bonusAmount: 100,
                    redemptionMethod: methods[i],
                    customerBalance: 200,
                });

                expect(result.valid).toBe(true);
                expect(result.redemptionValue).toBe(100 * expected[i]);
            }
        });

        test('should process points redemption', async () => {
            const result = await loyaltyProgram.redeemPoints('cust_test_redeem', {
                pointsToRedeem: 500,
                method: 'accountCredit',
                currentPointsBalance: 1000,
                currentTier: 'silver',
            });

            expect(result.success).toBe(true);
            expect(result.pointsRedeemed).toBe(500);
            expect(result.creditValue).toBe(25.00);
            expect(result.newPointsBalance).toBe(500);
        });
    });

    // ============================================================================
    // ACTIVITY TRACKING TESTS
    // ============================================================================

    describe('Activity Recording', () => {
        test('should record shipment activity and award points', async () => {
            const result = await loyaltyProgram.recordActivity('cust_test_activity1', {
                type: 'shipment',
                amount: 150,
                currentTier: 'gold',
            });

            expect(result.success).toBe(true);
            expect(result.activityType).toBe('shipment');
            expect(result.pointsEarned).toBeGreaterThan(0);
        });

        test('should record purchase activity', async () => {
            const result = await loyaltyProgram.recordActivity('cust_test_activity2', {
                type: 'purchase',
                amount: 75,
                currentTier: 'silver',
            });

            expect(result.success).toBe(true);
            expect(result.pointsEarned).toBe(93); // 75 * 1.25
        });

        test('should record referral activity', async () => {
            const result = await loyaltyProgram.recordActivity('cust_test_activity3', {
                type: 'referral',
                currentTier: 'platinum',
            });

            expect(result.success).toBe(true);
            expect(result.pointsEarned).toBeGreaterThan(0);
        });
    });

    // ============================================================================
    // MONTHLY BONUS TESTS
    // ============================================================================

    describe('Monthly & Promotional Bonuses', () => {
        test('should calculate monthly bonuses for each tier', async () => {
            const tiers = ['bronze', 'silver', 'gold', 'platinum'];
            const expectedMonthly = [0, 100, 250, 500];

            for (let i = 0; i < tiers.length; i++) {
                const result = await loyaltyProgram.calculateMonthlyBonus(tiers[i]);

                expect(result.success).toBe(true);
                expect(result.monthlyBonus).toBe(expectedMonthly[i]);
            }
        });

        test('should calculate quarterly bonuses', async () => {
            const result = await loyaltyProgram.calculateMonthlyBonus('platinum');

            expect(result.success).toBe(true);
            expect(result.quarterlyBonus).toBe(1000);
        });

        test('should calculate annual bonuses', async () => {
            const result = await loyaltyProgram.calculateMonthlyBonus('platinum');

            expect(result.success).toBe(true);
            expect(result.annualBonus).toBe(5000);
        });
    });

    // ============================================================================
    // REPORT GENERATION TESTS
    // ============================================================================

    describe('Report Generation', () => {
        test('should generate comprehensive loyalty report', async () => {
            const report = await loyaltyProgram.generateLoyaltyReport('cust_test_report', {
                currentTier: 'gold',
                points: 5500,
                pointsBalance: 2200,
                lifetimeSpend: 3500,
                totalShipments: 120,
                membershipMonths: 12,
                recentActivityDays: 3,
            });

            expect(report.success).toBe(true);
            expect(report.tierStatus).toBeDefined();
            expect(report.pointsStatus).toBeDefined();
            expect(report.activity).toBeDefined();
            expect(report.benefits).toBeDefined();
            expect(report.recommendations).toBeDefined();
        });

        test('should provide upgrade recommendations', async () => {
            const report = await loyaltyProgram.generateLoyaltyReport('cust_test_report2', {
                currentTier: 'gold',
                points: 8000,
                pointsBalance: 3000,
                lifetimeSpend: 6500,
                totalShipments: 250,
                membershipMonths: 20,
                recentActivityDays: 1,
            });

            expect(report.success).toBe(true);
            expect(report.recommendations.some(r => r.type === 'upgrade')).toBe(true);
        });
    });
});
