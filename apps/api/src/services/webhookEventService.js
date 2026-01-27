/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Webhook Event Replay Service
 * Handles failed webhook event persistence and replay
 */

const { prisma } = require('../database');
const logger = require('../lib/structuredLogging');

class WebhookEventService {
    /**
     * Store webhook event for potential replay
     */
    async storeWebhookEvent(eventId, eventType, payload, source = 'stripe') {
        try {
            const event = await prisma.webhookEvent.create({
                data: {
                    eventId,
                    type: eventType,
                    payload: JSON.stringify(payload),
                    source,
                    status: 'PENDING',
                    retryCount: 0,
                    lastError: null,
                    nextRetry: new Date(),
                },
            });

            logger.info('Webhook event stored', {
                eventId,
                eventType,
                eventRecordId: event.id,
            });

            return event;
        } catch (error) {
            logger.error('Failed to store webhook event', {
                eventId,
                error: error.message,
            });
            return null;
        }
    }

    /**
     * Mark webhook event as processed
     */
    async markProcessed(eventId) {
        try {
            const event = await prisma.webhookEvent.update({
                where: { eventId },
                data: {
                    status: 'PROCESSED',
                    lastError: null,
                    retryCount: 0,
                },
            });

            logger.info('Webhook event marked processed', { eventId });
            return event;
        } catch (error) {
            logger.warn('Failed to mark webhook as processed', {
                eventId,
                error: error.message,
            });
            return null;
        }
    }

    /**
     * Mark webhook event as failed and schedule retry
     */
    async markFailed(eventId, error, retryDelay = 60000) {
        try {
            const now = new Date();
            const nextRetry = new Date(now.getTime() + retryDelay);

            const event = await prisma.webhookEvent.update({
                where: { eventId },
                data: {
                    status: 'FAILED',
                    lastError: error.message,
                    retryCount: { increment: 1 },
                    nextRetry,
                },
            });

            logger.warn('Webhook event marked failed, scheduled retry', {
                eventId,
                retryCount: event.retryCount,
                nextRetry,
                error: error.message,
            });

            return event;
        } catch (error) {
            logger.error('Failed to mark webhook as failed', {
                eventId,
                error: error.message,
            });
            return null;
        }
    }

    /**
     * Get pending webhooks ready for retry
     */
    async getPendingRetries(limit = 100) {
        try {
            const now = new Date();
            const events = await prisma.webhookEvent.findMany({
                where: {
                    status: 'FAILED',
                    nextRetry: { lte: now },
                    retryCount: { lt: 3 }, // Max 3 retries
                },
                orderBy: { nextRetry: 'asc' },
                take: limit,
            });

            logger.info('Found pending webhook retries', { count: events.length });
            return events;
        } catch (error) {
            logger.error('Failed to get pending retries', { error: error.message });
            return [];
        }
    }

    /**
     * Replay a failed webhook event
     */
    async replayEvent(eventId, webhookHandler) {
        try {
            const event = await prisma.webhookEvent.findUnique({
                where: { eventId },
            });

            if (!event) {
                logger.warn('Webhook event not found for replay', { eventId });
                return { success: false, error: 'Event not found' };
            }

            const payload = JSON.parse(event.payload);

            try {
                // Call the webhook handler
                await webhookHandler(payload);

                // Mark as processed
                await this.markProcessed(eventId);

                logger.info('Webhook event replayed successfully', {
                    eventId,
                    previousRetries: event.retryCount,
                });

                return { success: true, message: 'Event processed' };
            } catch (handlerError) {
                // Exponential backoff: 60s, 5min, 30min
                const delays = [60000, 300000, 1800000];
                const nextDelay = delays[Math.min(event.retryCount, delays.length - 1)];

                await this.markFailed(eventId, handlerError, nextDelay);

                return {
                    success: false,
                    error: handlerError.message,
                    retries: event.retryCount + 1,
                };
            }
        } catch (error) {
            logger.error('Failed to replay webhook event', {
                eventId,
                error: error.message,
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Get failed webhook events for admin dashboard
     */
    async getFailedEvents(page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;

            const [events, total] = await Promise.all([
                prisma.webhookEvent.findMany({
                    where: { status: 'FAILED' },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.webhookEvent.count({
                    where: { status: 'FAILED' },
                }),
            ]);

            return {
                data: events,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Failed to get failed events', { error: error.message });
            return { data: [], pagination: { total: 0, page, limit, pages: 0 } };
        }
    }

    /**
     * Get webhook event statistics
     */
    async getWebhookStats() {
        try {
            const [total, processed, failed, pending] = await Promise.all([
                prisma.webhookEvent.count(),
                prisma.webhookEvent.count({ where: { status: 'PROCESSED' } }),
                prisma.webhookEvent.count({ where: { status: 'FAILED' } }),
                prisma.webhookEvent.count({
                    where: {
                        status: 'FAILED',
                        nextRetry: { lte: new Date() },
                    },
                }),
            ]);

            return {
                total,
                processed,
                failed,
                pendingRetry: pending,
                successRate: total > 0 ? ((processed / total) * 100).toFixed(2) : 0,
            };
        } catch (error) {
            logger.error('Failed to get webhook stats', { error: error.message });
            return {
                total: 0,
                processed: 0,
                failed: 0,
                pendingRetry: 0,
                successRate: 0,
            };
        }
    }

    /**
     * Clean up old processed events (keep last 30 days)
     */
    async cleanupOldEvents(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const deleted = await prisma.webhookEvent.deleteMany({
                where: {
                    status: 'PROCESSED',
                    createdAt: { lt: cutoffDate },
                },
            });

            logger.info('Cleaned up old webhook events', {
                deleted: deleted.count,
                beforeDate: cutoffDate,
            });

            return deleted.count;
        } catch (error) {
            logger.error('Failed to cleanup old events', { error: error.message });
            return 0;
        }
    }
}

// Singleton
let instance = null;

function getInstance() {
    if (!instance) {
        instance = new WebhookEventService();
    }
    return instance;
}

module.exports = {
    getInstance,
    WebhookEventService,
};
