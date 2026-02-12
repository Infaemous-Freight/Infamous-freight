/**
 * Billing & Compliance API Routes
 * Integrates TIER 1-2 services
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope } = require("../middleware/security");
const { limiters } = require("../middleware/security");
const { handleValidationErrors, validateString } = require("../middleware/validation");
const tieredPricingService = require("../services/tieredPricingService");
const complianceAutomationService = require("../services/complianceAutomationService");
const referralProgramService = require("../services/referralProgramService");
const advancedMonitoringService = require("../services/advancedMonitoringService");
const db = require("../db/prisma");

// ============================================
// TIER 1: MONITORING & HEALTH
// ============================================

/**
 * GET /api/health
 * Health check with database connection
 */
router.get("/health", async (req, res, next) => {
    try {
        const health = await advancedMonitoringService.getHealthStatus(db);
        res.status(health.status === "healthy" ? 200 : 503).json(health);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/monitoring/rum-config
 * Get RUM configuration for frontend
 */
router.get("/monitoring/rum-config", (req, res) => {
    const config = advancedMonitoringService.getRUMConfiguration();
    res.json(config);
});

// ============================================
// TIER 1: COMPLIANCE (GDPR)
// ============================================

/**
 * GET /api/compliance/gdpr/checklist
 * Get GDPR compliance checklist
 */
router.get("/compliance/gdpr/checklist", (req, res) => {
    const checklist = complianceAutomationService.getGDPRChecklist();
    res.json(checklist);
});

/**
 * GET /api/compliance/data/export
 * Export user's data (GDPR Right to Access)
 */
router.get(
    "/compliance/data/export",
    limiters.general,
    authenticate,
    async (req, res, next) => {
        try {
            const data = await complianceAutomationService.exportUserData(req.user.sub);
            res.json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * DELETE /api/compliance/data/delete
 * Delete user's data (GDPR Right to Erasure)
 */
router.delete(
    "/compliance/data/delete",
    limiters.general,
    authenticate,
    async (req, res, next) => {
        try {
            await complianceAutomationService.deleteUserData(
                req.user.sub,
                req.body.reason || "user_requested"
            );
            res.json({ success: true, message: "Data deletion initiated" });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/compliance/consents
 * Get user's consents
 */
router.get(
    "/compliance/consents",
    limiters.general,
    authenticate,
    async (req, res, next) => {
        try {
            const consents = await db.userConsent.findMany({
                where: { userId: req.user.sub },
            });
            res.json(consents);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * PUT /api/compliance/consents/:consentType
 * Update user consent
 */
router.put(
    "/compliance/consents/:consentType",
    limiters.general,
    authenticate,
    async (req, res, next) => {
        try {
            const { consentType } = req.params;
            const { value } = req.body;

            const consent = await complianceAutomationService.updateConsent(
                req.user.sub,
                consentType,
                value,
                req.ip
            );

            res.json({ success: true, consent });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/compliance/reports
 * Get compliance reports (admin only)
 */
router.get(
    "/compliance/reports",
    limiters.general,
    authenticate,
    requireScope("admin:compliance"),
    async (req, res, next) => {
        try {
            const { organizationId } = req.query;

            const reports = await db.complianceReport.findMany({
                where: { organizationId },
                orderBy: { generatedAt: "desc" },
                take: 10,
            });

            res.json(reports);
        } catch (err) {
            next(err);
        }
    }
);

// ============================================
// TIER 2: PRICING & SUBSCRIPTIONS
// ============================================

/**
 * GET /api/pricing/tiers
 * List all pricing tiers
 */
router.get("/pricing/tiers", (req, res) => {
    const tiers = tieredPricingService.listTiers();
    res.json(tiers);
});

/**
 * GET /api/pricing/current-plan
 * Get user's current plan
 */
router.get(
    "/pricing/current-plan",
    limiters.general,
    authenticate,
    async (req, res, next) => {
        try {
            const plan = await tieredPricingService.getCurrentPlan(req.user.sub);
            res.json(plan);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/pricing/checkout
 * Create checkout session
 */
router.post(
    "/pricing/checkout",
    limiters.billing,
    authenticate,
    [validateString("tier"), validateString("billingCycle")],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { tier, billingCycle } = req.body;

            const session = await tieredPricingService.createCheckoutSession(
                req.user.sub,
                tier,
                billingCycle || "monthly"
            );

            res.json({
                success: true,
                sessionId: session.id,
                url: session.url,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/pricing/upgrade
 * Upgrade tier
 */
router.post(
    "/pricing/upgrade",
    limiters.billing,
    authenticate,
    [validateString("tier")],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { tier } = req.body;

            const result = await tieredPricingService.upgradeTier(req.user.sub, tier);

            advancedMonitoringService.logBusinessEvent("tier_upgraded", {
                userId: req.user.sub,
                newTier: tier,
            });

            res.json({ success: true, ...result });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/pricing/downgrade
 * Downgrade tier
 */
router.post(
    "/pricing/downgrade",
    limiters.billing,
    authenticate,
    [validateString("tier")],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { tier } = req.body;

            const result = await tieredPricingService.downgradeTier(req.user.sub, tier);

            advancedMonitoringService.logBusinessEvent("tier_downgraded", {
                userId: req.user.sub,
                newTier: tier,
            });

            res.json({ success: true, ...result });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/pricing/cancel
 * Cancel subscription
 */
router.post(
    "/pricing/cancel",
    limiters.billing,
    authenticate,
    async (req, res, next) => {
        try {
            const result = await tieredPricingService.cancelSubscription(req.user.sub);

            advancedMonitoringService.logBusinessEvent("subscription_canceled", {
                userId: req.user.sub,
            });

            res.json(result);
        } catch (err) {
            next(err);
        }
    }
);

// ============================================
// TIER 2: REFERRAL PROGRAM
// ============================================

/**
 * GET /api/referrals/link
 * Get referral link for user
 */
router.get(
    "/referrals/link",
    limiters.general,
    authenticate,
    async (req, res, next) => {
        try {
            const link = await referralProgramService.createReferralLink(req.user.sub);
            res.json(link);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/referrals/stats
 * Get user's referral stats
 */
router.get(
    "/referrals/stats",
    limiters.general,
    authenticate,
    async (req, res, next) => {
        try {
            const stats = await referralProgramService.getUserReferralStats(req.user.sub);
            res.json(stats);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/referrals/leaderboard
 * Get referral leaderboard
 */
router.get("/referrals/leaderboard", async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit || "10", 10);
        const leaderboard = await referralProgramService.getLeaderboard(limit);
        res.json(leaderboard);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/referrals/track-signup
 * Track referral signup
 */
router.post(
    "/referrals/track-signup",
    limiters.general,
    async (req, res, next) => {
        try {
            const { referrerUserId, referreeEmail } = req.body;

            const referral = await referralProgramService.trackReferralSignup(
                referrerUserId,
                referreeEmail,
                {
                    ipAddress: req.ip,
                    userAgent: req.headers["user-agent"],
                }
            );

            res.json({
                success: true,
                referral,
                fraudDetected: referral.fraudDetected,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/referrals/mark-converted
 * Mark referral as converted
 */
router.post(
    "/referrals/mark-converted",
    limiters.general,
    authenticate,
    requireScope("admin:referrals"),
    async (req, res, next) => {
        try {
            const { referralId, referreeUserId } = req.body;

            const referral = await referralProgramService.markReferralConverted(
                referralId,
                referreeUserId
            );

            res.json({ success: true, referral });
        } catch (err) {
            next(err);
        }
    }
);

// ============================================
// BUSINESS EVENT LOGGING
// ============================================

/**
 * POST /api/events/log
 * Log custom business event
 */
router.post(
    "/events/log",
    limiters.general,
    authenticate,
    async (req, res, next) => {
        try {
            const { eventName, eventData } = req.body;

            advancedMonitoringService.logBusinessEvent(eventName, {
                userId: req.user.sub,
                ...eventData,
            });

            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
