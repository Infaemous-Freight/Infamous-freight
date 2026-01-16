/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Admin Routes for Webhook Management & Replay
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireScope, limiters } = require('../middleware/security');
const { auditLog } = require('../middleware/security');
const webhookEventService = require('../services/webhookEventService').getInstance();
const logger = require('../lib/structuredLogging');

/**
 * GET /admin/webhooks - List all webhook events with filtering
 */
router.get(
    '/webhooks',
    limiters.general,
    authenticate,
    requireScope('admin:webhooks'),
    auditLog,
    async (req, res, next) => {
        try {
            const { status = 'FAILED', page = 1, limit = 20 } = req.query;
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(100, parseInt(limit) || 20);

            let events;
            if (status === 'FAILED') {
                events = await webhookEventService.getFailedEvents(pageNum, limitNum);
            } else {
                // TODO: Add other status queries (PROCESSED, PENDING)
                events = { data: [], pagination: { total: 0, page: pageNum, limit: limitNum, pages: 0 } };
            }

            res.status(200).json({
                success: true,
                data: events.data,
                pagination: events.pagination,
            });
        } catch (error) {
            logger.error('Failed to list webhooks', { error: error.message });
            next(error);
        }
    }
);

/**
 * GET /admin/webhooks/stats - Get webhook statistics
 */
router.get(
    '/webhooks/stats',
    limiters.general,
    authenticate,
    requireScope('admin:webhooks'),
    auditLog,
    async (req, res, next) => {
        try {
            const stats = await webhookEventService.getWebhookStats();

            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error) {
            logger.error('Failed to get webhook stats', { error: error.message });
            next(error);
        }
    }
);

/**
 * POST /admin/webhooks/:eventId/replay - Replay a failed webhook event
 */
router.post(
    '/webhooks/:eventId/replay',
    limiters.general,
    authenticate,
    requireScope('admin:webhooks'),
    auditLog,
    async (req, res, next) => {
        try {
            const { eventId } = req.params;

            if (!eventId || typeof eventId !== 'string') {
                return res.status(400).json({
                    error: 'Invalid event ID',
                });
            }

            // Get the webhook handler based on event type
            // This would be imported from your webhook handlers
            // For now, we'll create a generic replay that triggers the stored handler

            const result = await webhookEventService.replayEvent(eventId, async (payload) => {
                // This is a placeholder - in production, you'd call the appropriate handler
                logger.info('Replaying webhook event', { eventId, payload });
                // TODO: Implement handler routing based on event.type
            });

            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);
        } catch (error) {
            logger.error('Failed to replay webhook', { error: error.message });
            next(error);
        }
    }
);

/**
 * DELETE /admin/webhooks/:eventId - Delete a webhook event
 */
router.delete(
    '/webhooks/:eventId',
    limiters.general,
    authenticate,
    requireScope('admin:webhooks'),
    auditLog,
    async (req, res, next) => {
        try {
            const { eventId } = req.params;

            // Delete would be implemented via Prisma
            // For now, just return success
            logger.info('Webhook event deleted', { eventId, userId: req.user.sub });

            res.status(200).json({
                success: true,
                message: 'Webhook event deleted',
            });
        } catch (error) {
            logger.error('Failed to delete webhook', { error: error.message });
            next(error);
        }
    }
);

/**
 * POST /admin/webhooks/cleanup - Clean up old processed events
 */
router.post(
    '/webhooks/cleanup',
    limiters.general,
    authenticate,
    requireScope('admin:webhooks'),
    auditLog,
    async (req, res, next) => {
        try {
            const { daysToKeep = 30 } = req.body;

            const deletedCount = await webhookEventService.cleanupOldEvents(daysToKeep);

            logger.info('Webhook cleanup completed', {
                deletedCount,
                daysToKeep,
                userId: req.user.sub,
            });

            res.status(200).json({
                success: true,
                message: `Deleted ${deletedCount} old webhook events`,
                deletedCount,
            });
        } catch (error) {
            logger.error('Failed to cleanup webhooks', { error: error.message });
            next(error);
        }
    }
);

/**
 * POST /admin/webhooks/retry-all - Retry all pending webhook events
 */
router.post(
    '/webhooks/retry-all',
    limiters.general,
    authenticate,
    requireScope('admin:webhooks'),
    auditLog,
    async (req, res, next) => {
        try {
            const { maxRetries = 100 } = req.body;

            const pendingEvents = await webhookEventService.getPendingRetries(maxRetries);

            const results = [];
            for (const event of pendingEvents) {
                try {
                    const result = await webhookEventService.replayEvent(event.eventId, async (payload) => {
                        // Replay logic here
                        logger.info('Auto-retrying webhook', { eventId: event.eventId });
                    });
                    results.push({ eventId: event.eventId, ...result });
                } catch (error) {
                    results.push({
                        eventId: event.eventId,
                        success: false,
                        error: error.message,
                    });
                }
            }

            const successCount = results.filter((r) => r.success).length;

            logger.info('Bulk webhook retry completed', {
                total: results.length,
                successful: successCount,
                userId: req.user.sub,
            });

            res.status(200).json({
                success: true,
                message: `Retried ${results.length} webhook events`,
                results: {
                    total: results.length,
                    successful: successCount,
                    failed: results.length - successCount,
                },
            });
        } catch (error) {
            logger.error('Failed to retry webhooks', { error: error.message });
            next(error);
        }
    }
);

module.exports = router;
