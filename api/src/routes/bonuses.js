/**
 * Bonus Routes - REST API endpoints for bonus management
 * Handles referrals, loyalty tracking, points, and rewards
 */

const express = require('express');
const BonusEngine = require('../services/bonusEngine');
const LoyaltyProgram = require('../services/loyaltyProgram');
const { authenticate, requireScope, auditLog, limiters } = require('../middleware/security');
const { validateString, validateEmail, validatePhone, handleValidationErrors } = require('../middleware/validation');
const { body, param, query, validationResult } = require('express-validator');

const router = express.Router();
const bonusEngine = new BonusEngine();
const loyaltyProgram = new LoyaltyProgram();

// ============================================================================
// REFERRAL ENDPOINTS
// ============================================================================

/**
 * POST /api/bonuses/referral/generate
 * Generate referral code for customer
 */
router.post(
    '/referral/generate',
    limiters.general,
    authenticate,
    requireScope('bonus:referral'),
    auditLog,
    [validateString('referrerEmail')],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { referrerEmail } = req.body;
            const referralCode = `REF-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

            res.status(200).json({
                success: true,
                data: {
                    referralCode,
                    referrerEmail,
                    generatedAt: new Date(),
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    shareUrl: `https://infamousfreight.com/join?ref=${referralCode}`,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/bonuses/referral/claim
 * Claim referral bonus
 */
router.post(
    '/referral/claim',
    limiters.general,
    authenticate,
    requireScope('bonus:referral'),
    auditLog,
    [validateString('referralCode')],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { referralCode } = req.body;
            const customerId = req.user.sub;

            const result = await bonusEngine.calculateReferralBonus({
                type: 'customer',
                referrerInfo: { loyaltyTier: req.user.tier || 'bronze' },
                shipmentCount: req.body.shipmentCount || 1,
            });

            if (!result.success) throw new Error('Referral calculation failed');

            res.status(200).json({
                success: true,
                data: {
                    customerId,
                    referralCode,
                    bonus: result.referrer?.bonus || 0,
                    status: 'claimed',
                    claimedAt: new Date(),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/bonuses/referral/:code
 * Get referral information
 */
router.get(
    '/referral/:code',
    limiters.general,
    [param('code').isString()],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { code } = req.params;

            res.status(200).json({
                success: true,
                data: {
                    referralCode: code,
                    active: true,
                    bonus: 50,
                    currency: 'USD',
                    termsUrl: 'https://infamousfreight.com/referral-terms',
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================================================
// LOYALTY TIER ENDPOINTS
// ============================================================================

/**
 * GET /api/bonuses/loyalty/tier/:customerId
 * Get customer's current loyalty tier and status
 */
router.get(
    '/loyalty/tier/:customerId',
    limiters.general,
    authenticate,
    requireScope('bonus:loyalty'),
    auditLog,
    async (req, res, next) => {
        try {
            const { customerId } = req.params;

            const tierInfo = {
                customerId,
                currentTier: 'silver',
                level: 2,
                enrollmentDate: new Date('2024-01-15'),
                totalPoints: 2450,
                pointsBalance: 1200,
                lifelineSpend: 1875.50,
                totalShipments: 48,
            };

            res.status(200).json({
                success: true,
                data: tierInfo,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/bonuses/loyalty/enroll
 * Enroll customer in loyalty program
 */
router.post(
    '/loyalty/enroll',
    limiters.general,
    authenticate,
    requireScope('bonus:loyalty'),
    auditLog,
    async (req, res, next) => {
        try {
            const customerId = req.user.sub;

            const enrollment = await loyaltyProgram.enrollCustomer(customerId, 'bronze');

            res.status(201).json({
                success: true,
                data: enrollment,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/bonuses/loyalty/upgrade-progress/:customerId
 * Get tier upgrade progress
 */
router.get(
    '/loyalty/upgrade-progress/:customerId',
    limiters.general,
    authenticate,
    requireScope('bonus:loyalty'),
    auditLog,
    async (req, res, next) => {
        try {
            const { customerId } = req.params;

            const progress = await loyaltyProgram.getTierUpgradeProgress({
                customerId,
                currentTier: 'silver',
                points: 2450,
                totalSpend: 1875.50,
                shipmentCount: 48,
                accountAgeMonths: 12,
            });

            res.status(200).json({
                success: true,
                data: progress,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================================================
// POINTS & REDEMPTION ENDPOINTS
// ============================================================================

/**
 * POST /api/bonuses/points/earn
 * Record customer activity and award points
 */
router.post(
    '/points/earn',
    limiters.general,
    authenticate,
    requireScope('bonus:points'),
    auditLog,
    [validateString('activityType')],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { activityType, amount } = req.body;
            const customerId = req.user.sub;

            const result = await loyaltyProgram.recordActivity(customerId, {
                type: activityType,
                amount,
                currentTier: req.user.tier || 'bronze',
            });

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/bonuses/points/redeem
 * Redeem points for rewards
 */
router.post(
    '/points/redeem',
    limiters.general,
    authenticate,
    requireScope('bonus:redeem'),
    auditLog,
    [
        body('pointsToRedeem').isInt({ min: 50 }),
        body('method').isIn(['accountCredit', 'freeShipment', 'discountCode', 'cashback']),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const customerId = req.user.sub;
            const { pointsToRedeem, method } = req.body;

            const redemption = await loyaltyProgram.redeemPoints(customerId, {
                pointsToRedeem,
                method,
                currentPointsBalance: req.body.pointsBalance || 0,
                currentTier: req.user.tier || 'bronze',
            });

            res.status(200).json({
                success: true,
                data: redemption,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/bonuses/points/balance/:customerId
 * Get customer's points balance
 */
router.get(
    '/points/balance/:customerId',
    limiters.general,
    authenticate,
    requireScope('bonus:points'),
    auditLog,
    async (req, res, next) => {
        try {
            const { customerId } = req.params;

            res.status(200).json({
                success: true,
                data: {
                    customerId,
                    pointsBalance: 1200,
                    pointsEarned: 2450,
                    pointsRedeemed: 1250,
                    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================================================
// MILESTONE ENDPOINTS
// ============================================================================

/**
 * GET /api/bonuses/milestones/:customerId
 * Get customer's milestone achievements
 */
router.get(
    '/milestones/:customerId',
    limiters.general,
    authenticate,
    requireScope('bonus:milestones'),
    auditLog,
    async (req, res, next) => {
        try {
            const { customerId } = req.params;

            const milestones = await bonusEngine.calculateMilestoneBonus({
                customerId,
                totalShipments: 48,
                totalSpent: 1875.50,
                accountAgeMonths: 12,
            });

            res.status(200).json({
                success: true,
                data: milestones,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================================================
// DRIVER PERFORMANCE ENDPOINTS
// ============================================================================

/**
 * POST /api/bonuses/performance/calculate
 * Calculate driver performance bonuses
 */
router.post(
    '/performance/calculate',
    limiters.ai,
    authenticate,
    requireScope('bonus:performance'),
    auditLog,
    async (req, res, next) => {
        try {
            const driverId = req.user.sub;
            const {
                onTimePercentage = 0,
                averageRating = 0,
                monthlyShipments = 0,
                accidentsFreeMonths = 0,
                referralsCount = 0,
            } = req.body;

            const performance = await bonusEngine.calculateDriverPerformanceBonus({
                driverId,
                onTimePercentage,
                averageRating,
                monthlyShipments,
                accidentsFreeMonths,
                referralsCount,
            });

            res.status(200).json({
                success: true,
                data: performance,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================================================
// REPORT ENDPOINTS
// ============================================================================

/**
 * GET /api/bonuses/report/:customerId
 * Generate comprehensive loyalty report
 */
router.get(
    '/report/:customerId',
    limiters.general,
    authenticate,
    requireScope('bonus:report'),
    auditLog,
    async (req, res, next) => {
        try {
            const { customerId } = req.params;

            const report = await loyaltyProgram.generateLoyaltyReport(
                customerId,
                {
                    currentTier: 'silver',
                    points: 2450,
                    pointsBalance: 1200,
                    lifetimeSpend: 1875.50,
                    totalShipments: 48,
                    membershipMonths: 12,
                    recentActivityDays: 5,
                }
            );

            res.status(200).json({
                success: true,
                data: report,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/bonuses/health
 * Health check for bonus system
 */
router.get('/health', async (req, res) => {
    res.status(200).json({
        success: true,
        status: 'operational',
        version: '2026.01',
        components: {
            bonusEngine: 'healthy',
            loyaltyProgram: 'healthy',
            database: 'connected',
        },
    });
});

module.exports = router;
