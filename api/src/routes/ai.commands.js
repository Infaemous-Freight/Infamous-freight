const express = require('express');
const { prisma } = require('../db/prisma');
const { cacheMiddleware } = require('../middleware/cache');
const { limiters, authenticate, requirePlan, requireScope, auditLog } = require('../middleware/security');
const { validateString, handleValidationErrors } = require('../middleware/validation');
const { recordUsage, estimateTokenUnits } = require('../billing/usageRecorder');

const router = express.Router();

/**
 * POST /api/ai/command
 * Process AI command with scope-based auth and rate limiting
 * Scope: ai:command
 * Feature flag: ENABLE_AI_COMMANDS
 */
router.post(
    '/ai/command',
    limiters.ai,
    authenticate,
    requirePlan('pro'),
    requireScope('ai:command'),
    auditLog,
    validateString('command', { maxLength: 500 }),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            // Feature flag check
            if (process.env.ENABLE_AI_COMMANDS === 'false') {
                return res.status(503).json({
                    ok: false,
                    error: 'AI commands are currently disabled',
                });
            }

            const { command } = req.body;
            const startTime = Date.now();

            // Persist request placeholder
            await prisma.aiEvent.create({
                data: {
                    userId: req.user.sub,
                    command,
                    response: 'pending',
                    provider: process.env.AI_PROVIDER || 'synthetic',
                },
            });

            const responsePayload = {
                ok: true,
                command,
                result: 'AI processing queued',
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime,
            };

            res.json(responsePayload);

            const tenantId = req.auth?.organizationId || req.user?.sub;
            if (tenantId) {
                try {
                    const tokenUnits = estimateTokenUnits(command);
                    await recordUsage({
                        tenantId,
                        feature: 'genesis_ai_agent',
                        quantity: tokenUnits,
                    });
                } catch (usageError) {
                    console.warn('Failed to record AI usage', {
                        tenantId,
                        error: usageError?.message || usageError,
                    });
                }
            }
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/ai/history
 * Get AI command history for current user
 * Scope: ai:history
 */
router.get(
    '/ai/history',
    limiters.ai,
    authenticate,
    requireScope('ai:history'),
    cacheMiddleware(30),
    auditLog,
    async (req, res, next) => {
        try {
            const { take = 20, skip = 0 } = req.query;
            const limit = Math.min(Number(take) || 20, 100);
            const offset = Number(skip) || 0;

            const history = await prisma.aiEvent.findMany({
                where: { userId: req.user.sub },
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
            });

            res.json({
                ok: true,
                history,
                count: history.length,
                pagination: { take: limit, skip: offset },
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
