/*
 * Copyright © 2026 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Phase 22 API Routes - RevOps & AI-Driven Sales
 */

const express = require('express');
const router = express.Router();
const { limiters, authenticate, requireScope, auditLog } = require('../middleware/security');
const { validateString, handleValidationErrors } = require('../middleware/validation');
const { body, param } = require('express-validator');

// Import Phase 22 services (TypeScript modules imported as CommonJS)
const genesisSalesAI = require('../revops/genesisSalesAI');
const dynamicPricing = require('../revops/dynamicPricing');
const outboundEngine = require('../revops/outboundEngine');
const contractWorkflow = require('../revops/contractWorkflow');
const revopsDashboard = require('../revops/dashboard');

// ============================================
// GENESIS AI - SALES AUTOMATION
// ============================================

/**
 * POST /api/revops/leads/:leadId/qualify
 * Qualify a lead using Genesis AI
 */
router.post(
    '/leads/:leadId/qualify',
    limiters.general,
    authenticate,
    requireScope('admin'),
    auditLog,
    [param('leadId').isString().notEmpty(), handleValidationErrors],
    async (req, res, next) => {
        try {
            const { leadId } = req.params;
            const result = await genesisSalesAI.default.qualifyLead(leadId);
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
 * POST /api/revops/leads/auto-qualify
 * Auto-qualify all new leads (batch operation)
 */
router.post(
    '/leads/auto-qualify',
    limiters.general,
    authenticate,
    requireScope('admin'),
    auditLog,
    async (req, res, next) => {
        try {
            const qualified = await genesisSalesAI.default.autoQualifyNewLeads();
            res.status(200).json({
                success: true,
                data: { qualified },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/revops/opportunities/top
 * Get top sales opportunities (high-score deals)
 */
router.get(
    '/opportunities/top',
    limiters.general,
    authenticate,
    requireScope('sales'),
    async (req, res, next) => {
        try {
            const limit = parseInt(req.query.limit || '10');
            const opportunities = await genesisSalesAI.default.getTopOpportunities(limit);
            res.status(200).json({
                success: true,
                data: opportunities,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/revops/opportunities/:id/stage
 * Update opportunity stage
 */
router.patch(
    '/opportunities/:id/stage',
    limiters.general,
    authenticate,
    requireScope('sales'),
    auditLog,
    [
        param('id').isString().notEmpty(),
        body('stage').isString().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { stage, notes } = req.body;
            const opportunity = await genesisSalesAI.default.updateOpportunityStage(id, stage, notes);
            res.status(200).json({
                success: true,
                data: opportunity,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/revops/opportunities/:id/win
 * Mark opportunity as won
 */
router.post(
    '/opportunities/:id/win',
    limiters.general,
    authenticate,
    requireScope('sales'),
    auditLog,
    [
        param('id').isString().notEmpty(),
        body('orgId').isString().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { orgId } = req.body;
            const opportunity = await genesisSalesAI.default.markOpportunityWon(id, orgId);
            res.status(200).json({
                success: true,
                data: opportunity,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// DYNAMIC PRICING
// ============================================

/**
 * POST /api/revops/pricing/calculate
 * Calculate dynamic price for a job
 */
router.post(
    '/pricing/calculate',
    limiters.general,
    authenticate,
    [
        body('vehicleType').isString().notEmpty(),
        body('distance').isFloat({ min: 0 }),
        body('pickupLocation').isObject(),
        body('dropoffLocation').isObject(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { vehicleType, distance, pickupLocation, dropoffLocation, urgency, requestedPickupTime } = req.body;
            const orgId = req.auth?.organizationId;
            const userId = req.user?.sub;

            const pricing = await dynamicPricing.default.calculateDynamicPrice(
                {
                    basePrice: 0, // Calculated internally
                    vehicleType,
                    distance,
                    pickupLocation,
                    dropoffLocation,
                    urgency,
                    requestedPickupTime: requestedPickupTime ? new Date(requestedPickupTime) : undefined,
                },
                orgId,
                userId
            );

            res.status(200).json({
                success: true,
                data: pricing,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/revops/pricing/surge-stats
 * Get surge pricing statistics
 */
router.get(
    '/pricing/surge-stats',
    limiters.general,
    authenticate,
    requireScope('admin'),
    async (req, res, next) => {
        try {
            const days = parseInt(req.query.days || '7');
            const stats = await dynamicPricing.default.getSurgePricingStats(days);
            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/revops/pricing/recommendations
 * Get AI-powered pricing recommendations
 */
router.get(
    '/pricing/recommendations',
    limiters.general,
    authenticate,
    requireScope('admin'),
    async (req, res, next) => {
        try {
            const recommendations = await dynamicPricing.default.recommendPriceAdjustments();
            res.status(200).json({
                success: true,
                data: recommendations,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// OUTBOUND CAMPAIGNS
// ============================================

/**
 * POST /api/revops/campaigns
 * Create outbound campaign
 */
router.post(
    '/campaigns',
    limiters.general,
    authenticate,
    requireScope('marketing'),
    auditLog,
    [
        body('name').isString().notEmpty(),
        body('type').isIn(['email', 'sms', 'linkedin']),
        body('callToAction').isString().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { name, type, targetIndustry, targetRegion, targetCompanySize, callToAction, scheduledFor } = req.body;
            const createdBy = req.user.sub;

            const campaign = await outboundEngine.default.createCampaign(
                {
                    name,
                    type,
                    targetIndustry,
                    targetRegion,
                    targetCompanySize,
                    callToAction,
                    scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
                },
                createdBy
            );

            res.status(201).json({
                success: true,
                data: campaign,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/revops/campaigns/:id/recipients
 * Add recipients to campaign
 */
router.post(
    '/campaigns/:id/recipients',
    limiters.general,
    authenticate,
    requireScope('marketing'),
    auditLog,
    [
        param('id').isString().notEmpty(),
        body('recipients').isArray(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { recipients } = req.body;
            const count = await outboundEngine.default.addRecipientsToCampaign(id, recipients);
            res.status(200).json({
                success: true,
                data: { added: count },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/revops/campaigns/:id/send
 * Send campaign messages
 */
router.post(
    '/campaigns/:id/send',
    limiters.general,
    authenticate,
    requireScope('marketing'),
    auditLog,
    [param('id').isString().notEmpty(), handleValidationErrors],
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const batchSize = parseInt(req.body.batchSize || '50');
            const result = await outboundEngine.default.sendCampaignMessages(id, batchSize);
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
 * GET /api/revops/campaigns/:id/performance
 * Get campaign performance metrics
 */
router.get(
    '/campaigns/:id/performance',
    limiters.general,
    authenticate,
    requireScope('marketing'),
    [param('id').isString().notEmpty(), handleValidationErrors],
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const performance = await outboundEngine.default.getCampaignPerformance(id);
            res.status(200).json({
                success: true,
                data: performance,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/revops/campaigns/nurture
 * Auto-create nurture campaign for stale leads
 */
router.post(
    '/campaigns/nurture',
    limiters.general,
    authenticate,
    requireScope('marketing'),
    auditLog,
    async (req, res, next) => {
        try {
            const campaign = await outboundEngine.default.createNurtureCampaign();
            res.status(201).json({
                success: true,
                data: campaign,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// ENTERPRISE CONTRACTS
// ============================================

/**
 * POST /api/revops/contracts/generate
 * Generate enterprise contract
 */
router.post(
    '/contracts/generate',
    limiters.general,
    authenticate,
    requireScope('sales'),
    auditLog,
    [
        body('opportunityId').isString().notEmpty(),
        body('orgId').isString().notEmpty(),
        body('orgName').isString().notEmpty(),
        body('contactName').isString().notEmpty(),
        body('contactEmail').isEmail(),
        body('annualValue').isFloat({ min: 0 }),
        body('contractTerm').isInt({ min: 1 }),
        body('plan').isIn(['STARTER', 'GROWTH', 'ENTERPRISE', 'CUSTOM']),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { opportunityId, orgId, orgName, orgEmail, contactName, contactEmail, annualValue, contractTerm, plan, customTerms, startDate } = req.body;

            const contractId = await contractWorkflow.default.generateEnterpriseContract(
                opportunityId,
                {
                    orgId,
                    orgName,
                    orgEmail: orgEmail || contactEmail,
                    contactName,
                    contactEmail,
                    annualValue,
                    contractTerm,
                    plan,
                    customTerms,
                    startDate: startDate ? new Date(startDate) : undefined,
                }
            );

            res.status(201).json({
                success: true,
                data: { contractId },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/revops/contracts/pending
 * Get pending contracts
 */
router.get(
    '/contracts/pending',
    limiters.general,
    authenticate,
    requireScope('sales'),
    async (req, res, next) => {
        try {
            const contracts = await contractWorkflow.default.getPendingContracts();
            res.status(200).json({
                success: true,
                data: contracts,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/revops/contracts/:id
 * Get contract details
 */
router.get(
    '/contracts/:id',
    limiters.general,
    authenticate,
    requireScope('sales'),
    [param('id').isString().notEmpty(), handleValidationErrors],
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const contract = await contractWorkflow.default.getContract(id);
            res.status(200).json({
                success: true,
                data: contract,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/webhooks/contract-signed
 * Webhook: Contract signature completed (DocuSign)
 */
router.post(
    '/webhooks/contract-signed',
    limiters.webhook,
    [
        body('signatureRequestId').isString().notEmpty(),
        body('signerEmail').isEmail(),
        body('signerName').isString().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { signatureRequestId, signerEmail, signerName } = req.body;
            const contract = await contractWorkflow.default.handleSignatureCompleted(
                signatureRequestId,
                signerEmail,
                signerName
            );
            res.status(200).json({
                success: true,
                data: contract,
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// REVOPS DASHBOARD
// ============================================

/**
 * GET /api/revops/dashboard
 * Get complete RevOps dashboard
 */
router.get(
    '/dashboard',
    limiters.general,
    authenticate,
    requireScope('admin'),
    async (req, res, next) => {
        try {
            const dashboard = await revopsDashboard.default.getRevOpsDashboard();
            res.status(200).json({
                success: true,
                data: dashboard,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/revops/recommendations
 * Store a recommendation
 */
router.post(
    '/recommendations',
    limiters.general,
    authenticate,
    requireScope('admin'),
    auditLog,
    [
        body('category').isString().notEmpty(),
        body('description').isString().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const recommendation = await revopsDashboard.default.storeRecommendation(req.body);
            res.status(201).json({
                success: true,
                data: recommendation,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/revops/recommendations/:id/implement
 * Mark recommendation as implemented
 */
router.patch(
    '/recommendations/:id/implement',
    limiters.general,
    authenticate,
    requireScope('admin'),
    auditLog,
    [
        param('id').isString().notEmpty(),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { actualImpact } = req.body;
            const approvedBy = req.user.sub;
            const recommendation = await revopsDashboard.default.markRecommendationImplemented(
                id,
                approvedBy,
                actualImpact
            );
            res.status(200).json({
                success: true,
                data: recommendation,
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
