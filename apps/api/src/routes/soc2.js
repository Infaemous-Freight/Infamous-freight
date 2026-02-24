/**
 * SOC2 Compliance API Routes - Phase 7 Tier 3
 * 
 * Endpoints for SOC2 compliance management:
 * - GET /api/soc2/status - Compliance status
 * - GET /api/soc2/report - Generate compliance report
 * - GET /api/soc2/audit-log - Security audit log
 * - GET /api/soc2/incidents - Security incidents
 * - POST /api/soc2/incident - Report security incident
 * - GET /api/soc2/anomalies - Detected anomalies
 */

const express = require('express');
const router = express.Router();
const soc2Service = require('../services/soc2Compliance');
const { authenticate, requireScope, auditLog } = require('../middleware/security');
const { query, body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const logger = require('../middleware/logger').logger;
const { ApiResponse, HTTP_STATUS } = require('@infamous-freight/shared');
const { prisma } = require('../db/prisma');

/**
 * GET /api/soc2/status
 * Get SOC2 compliance status (Admin only)
 */
router.get(
    '/status',
    authenticate,
    requireScope('admin'),
    auditLog,
    async (req, res, next) => {
        try {
            const status = await soc2Service.getComplianceStatus();

            logger.info('SOC2 compliance status requested', {
                userId: req.user.sub
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: status,
                    message: 'SOC2 compliance status retrieved successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/soc2/report
 * Generate SOC2 compliance report (Admin only)
 */
router.get(
    '/report',
    authenticate,
    requireScope('admin'),
    auditLog,
    [
        query('startDate').optional().isISO8601().withMessage('Start date must be ISO 8601 format'),
        query('endDate').optional().isISO8601().withMessage('End date must be ISO 8601 format'),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const startDate = req.query.startDate
                ? new Date(req.query.startDate)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days

            const endDate = req.query.endDate
                ? new Date(req.query.endDate)
                : new Date();

            const report = await soc2Service.generateComplianceReport(startDate, endDate);

            logger.info('SOC2 compliance report generated', {
                userId: req.user.sub,
                reportId: report.reportId,
                period: report.period
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: report,
                    message: 'SOC2 compliance report generated successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/soc2/audit-log
 * Get security audit log (Admin only)
 */
router.get(
    '/audit-log',
    authenticate,
    requireScope('admin'),
    auditLog,
    [
        query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
        query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
        query('eventType').optional().isString(),
        query('severity').optional().isString(),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;
            const where = {};

            if (req.query.eventType) {
                where.eventType = req.query.eventType;
            }

            if (req.query.severity) {
                where.severity = req.query.severity;
            }

            const [events, total] = await Promise.all([
                prisma.securityEvent.findMany({
                    where,
                    orderBy: { timestamp: 'desc' },
                    take: limit,
                    skip: offset,
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                }),
                prisma.securityEvent.count({ where })
            ]);

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: {
                        events,
                        pagination: {
                            total,
                            limit,
                            offset,
                            hasMore: offset + limit < total
                        }
                    },
                    message: 'Security audit log retrieved successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/soc2/incidents
 * Get security incidents (Admin only)
 */
router.get(
    '/incidents',
    authenticate,
    requireScope('admin'),
    auditLog,
    [
        query('status').optional().isIn(['open', 'investigating', 'resolved']).withMessage('Invalid status'),
        query('severity').optional().isIn(['critical', 'high', 'medium', 'low']).withMessage('Invalid severity'),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const where = {};

            if (req.query.status) {
                where.result = req.query.status;
            }

            if (req.query.severity) {
                where.severity = req.query.severity;
            }

            // Get high-severity security events as incidents
            where.severity = where.severity || { in: ['critical', 'high'] };

            const incidents = await prisma.securityEvent.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: 50,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            role: true
                        }
                    }
                }
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: incidents,
                    message: 'Security incidents retrieved successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/soc2/incident
 * Report a security incident (Admin only)
 */
router.post(
    '/incident',
    authenticate,
    requireScope('admin'),
    auditLog,
    [
        body('description').isString().notEmpty().withMessage('Description is required'),
        body('severity').isIn(['critical', 'high', 'medium', 'low']).withMessage('Invalid severity'),
        body('affectedResources').optional().isArray(),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const { description, severity, affectedResources } = req.body;

            const incident = await soc2Service.logSecurityEvent({
                userId: req.user.sub,
                eventType: soc2Service.module.exports.SecurityEventType.SUSPICIOUS_ACTIVITY,
                severity,
                resource: 'system',
                action: 'incident_reported',
                result: 'open',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                metadata: {
                    description,
                    affectedResources: affectedResources || [],
                    reportedBy: req.user.sub,
                    reportedAt: new Date()
                }
            });

            logger.warn('Security incident reported', {
                incidentId: incident.id,
                severity,
                reportedBy: req.user.sub
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: incident,
                    message: 'Security incident reported successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/soc2/anomalies
 * Get detected anomalies (Admin only)
 */
router.get(
    '/anomalies',
    authenticate,
    requireScope('admin'),
    auditLog,
    [
        query('status').optional().isIn(['detected', 'investigating', 'resolved']).withMessage('Invalid status'),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const where = {};

            if (req.query.status) {
                where.status = req.query.status;
            }

            const anomalies = await prisma.anomalyDetection.findMany({
                where,
                orderBy: { detectedAt: 'desc' },
                take: 100,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            role: true
                        }
                    }
                }
            });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: anomalies,
                    message: 'Anomalies retrieved successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/soc2/metrics
 * Get security metrics (Admin only)
 */
router.get(
    '/metrics',
    authenticate,
    requireScope('admin'),
    auditLog,
    async (req, res, next) => {
        try {
            const metrics = await soc2Service.collectSecurityMetrics();

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: {
                        current: soc2Service.securityMetrics,
                        last24Hours: metrics
                    },
                    message: 'Security metrics retrieved successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
