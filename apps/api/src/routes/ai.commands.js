const express = require('express');
const { body } = require('express-validator');
const { prisma } = require('../db/prisma');
const { cacheMiddleware } = require('../middleware/cache');
const { limiters, authenticate, requireScope, auditLog } = require('../middleware/security');
const { validateString, handleValidationErrors } = require('../middleware/validation');
const { predictProfit } = require('../services/aiProfitService');

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

            res.json({
                ok: true,
                command,
                result: 'AI processing queued',
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/ai/profit-predict
 * Predict profit for a load using AI-inspired heuristics
 * Scope: ai:predict
 */
router.post(
    '/ai/profit-predict',
    limiters.ai,
    authenticate,
    requireScope('ai:predict'),
    auditLog,
    [
        body('origin').optional().isObject(),
        body('origin.lat').optional().isFloat({ min: -90, max: 90 }),
        body('origin.lng').optional().isFloat({ min: -180, max: 180 }),
        body('destination').optional().isObject(),
        body('destination.lat').optional().isFloat({ min: -90, max: 90 }),
        body('destination.lng').optional().isFloat({ min: -180, max: 180 }),
        body('distanceMiles').optional().isFloat({ min: 1 }),
        body('weight').optional().isFloat({ min: 0 }),
        body('ratePerMile').optional().isFloat({ min: 0 }),
        body('fuelPricePerGallon').optional().isFloat({ min: 0 }),
        body('mpg').optional().isFloat({ min: 1 }),
        body('maintenancePerMile').optional().isFloat({ min: 0 }),
        body('insurancePerMile').optional().isFloat({ min: 0 }),
        body('handlingFee').optional().isFloat({ min: 0 }),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const prediction = predictProfit(req.body || {});
            res.json({
                ok: true,
                prediction,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            next(err);
        }
    },
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
