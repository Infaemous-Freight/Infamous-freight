/**
 * GDPR Compliance API Routes - Phase 7 Tier 2
 * 
 * Endpoints for exercising GDPR rights:
 * - POST /api/gdpr/consent - Record user consent
 * - GET /api/gdpr/consent - Get user consents
 * - GET /api/gdpr/export - Export personal data (Article 15)
 * - DELETE /api/gdpr/erase - Right to be forgotten (Article 17)
 * - GET /api/gdpr/portability - Data portability (Article 20)
 * - POST /api/gdpr/restrict - Restrict processing (Article 18)
 * - GET /api/gdpr/status - Compliance status
 */

const express = require('express');
const router = express.Router();
const gdprService = require('../services/gdprCompliance');
const { authenticate, auditLog } = require('../middleware/security');
const { validateString, handleValidationErrors } = require('../middleware/validation');
const { body, query } = require('express-validator');
const logger = require('../middleware/logger').logger;
const { ApiResponse, HTTP_STATUS } = require('@infamous-freight/shared');

/**
 * POST /api/gdpr/consent
 * Record or update user consent
 */
router.post(
    '/consent',
    authenticate,
    auditLog,
    [
        body('consentType').isString().notEmpty().withMessage('Consent type is required'),
        body('granted').isBoolean().withMessage('Granted must be a boolean'),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const { consentType, granted } = req.body;
            const userId = req.user.sub;

            const metadata = {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                timestamp: new Date()
            };

            const consent = await gdprService.recordConsent(
                userId,
                consentType,
                granted,
                metadata
            );

            logger.info('Consent recorded via API', {
                userId,
                consentType,
                granted
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: {
                        consentType: consent.consentType,
                        granted: consent.granted,
                        grantedAt: consent.grantedAt,
                        revokedAt: consent.revokedAt
                    },
                    message: `Consent ${granted ? 'granted' : 'revoked'} successfully`
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/gdpr/consent
 * Get all user consents
 */
router.get(
    '/consent',
    authenticate,
    auditLog,
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const consents = await gdprService.getUserConsents(userId);

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: consents,
                    message: 'Consents retrieved successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/gdpr/export
 * Export all user data (Article 15 - Right to Access)
 */
router.get(
    '/export',
    authenticate,
    auditLog,
    async (req, res, next) => {
        try {
            const userId = req.user.sub;

            logger.info('GDPR data export requested', {
                userId,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });

            const exportData = await gdprService.exportUserData(userId);

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: exportData,
                    message: 'Data export completed successfully',
                    metadata: {
                        gdprArticle: 'Article 15 - Right to Access',
                        exportDate: new Date().toISOString()
                    }
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/gdpr/portability
 * Export data in portable format (Article 20 - Right to Data Portability)
 */
router.get(
    '/portability',
    authenticate,
    auditLog,
    [
        query('format').optional().isIn(['json', 'csv', 'xml']).withMessage('Format must be json, csv, or xml'),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const format = req.query.format || 'json';

            logger.info('GDPR data portability export requested', {
                userId,
                format
            });

            const { content, contentType, filename } = await gdprService.exportPortableData(
                userId,
                format
            );

            // Set download headers
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(content);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/gdpr/erase
 * Right to be forgotten (Article 17 - Right to Erasure)
 * 
 * CRITICAL: This permanently deletes user data
 */
router.delete(
    '/erase',
    authenticate,
    auditLog,
    [
        body('confirmationCode').isString().notEmpty().withMessage('Confirmation code is required'),
        body('reason').optional().isString(),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const { confirmationCode, reason } = req.body;

            // Verify confirmation code (should match user's email/ID hash)
            const expectedCode = require('crypto')
                .createHash('sha256')
                .update(`${userId}:DELETE`)
                .digest('hex')
                .substring(0, 8);

            if (confirmationCode !== expectedCode) {
                logger.warn('Invalid erasure confirmation code', { userId });
                return res.status(HTTP_STATUS.FORBIDDEN).json(
                    new ApiResponse({
                        success: false,
                        error: 'Invalid confirmation code',
                        message: 'Data erasure cancelled - invalid confirmation'
                    })
                );
            }

            logger.warn('GDPR data erasure requested', {
                userId,
                reason: reason || 'user_request',
                ip: req.ip
            });

            const result = await gdprService.eraseUserData(userId, reason);

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: result,
                    message: 'Data erasure completed successfully',
                    metadata: {
                        gdprArticle: 'Article 17 - Right to Erasure',
                        warning: 'This action is permanent and cannot be undone'
                    }
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/gdpr/restrict
 * Restrict data processing (Article 18)
 */
router.post(
    '/restrict',
    authenticate,
    auditLog,
    [
        body('restrictions').isArray().notEmpty().withMessage('Restrictions array is required'),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const { restrictions } = req.body;

            const result = await gdprService.restrictProcessing(userId, restrictions);

            logger.info('Processing restrictions applied', {
                userId,
                restrictions
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: result,
                    message: 'Processing restrictions applied successfully',
                    metadata: {
                        gdprArticle: 'Article 18 - Right to Restrict Processing'
                    }
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/gdpr/status
 * Get GDPR compliance status for user
 */
router.get(
    '/status',
    authenticate,
    auditLog,
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const status = await gdprService.getComplianceStatus(userId);

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: status,
                    message: 'Compliance status retrieved successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/gdpr/breach (Admin only)
 * Report data breach (Article 33-34)
 */
router.post(
    '/breach',
    authenticate,
    auditLog,
    [
        body('description').isString().notEmpty().withMessage('Breach description is required'),
        body('affectedUsers').optional().isArray(),
        body('dataCategories').optional().isArray(),
        body('highRisk').optional().isBoolean(),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            // Only admins can report breaches
            if (req.user.role !== 'admin') {
                return res.status(HTTP_STATUS.FORBIDDEN).json(
                    new ApiResponse({
                        success: false,
                        error: 'Insufficient permissions'
                    })
                );
            }

            const breachDetails = {
                description: req.body.description,
                affectedUsers: req.body.affectedUsers || [],
                dataCategories: req.body.dataCategories || [],
                highRisk: req.body.highRisk || false,
                reportedBy: req.user.sub,
                detectedAt: new Date()
            };

            const result = await gdprService.reportDataBreach(breachDetails);

            logger.error('Data breach reported via API', {
                breachId: result.breachId,
                reportedBy: req.user.sub
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: result,
                    message: 'Data breach logged - Follow incident response procedures',
                    metadata: {
                        gdprArticles: ['Article 33', 'Article 34'],
                        deadline: result.deadline
                    }
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
