const express = require('express');
const { prisma } = require('../db/prisma');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { limiters, authenticate, requireScope, auditLog } = require('../middleware/security');
const { validateString, validateEmail, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

/**
 * GET /api/users/me
 * Get current user profile
 * Scope: users:read
 */
router.get(
    '/users/me',
    limiters.general,
    authenticate,
    requireScope('users:read'),
    cacheMiddleware(30),
    auditLog,
    async (req, res, next) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.sub },
                include: {
                    shipments: { select: { id: true, status: true }, take: 5, orderBy: { createdAt: 'desc' } },
                },
            });

            if (!user) {
                return res.status(404).json({ ok: false, error: 'User not found' });
            }

            res.json({
                ok: true,
                user,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * PATCH /api/users/me
 * Update current user profile
 * Scope: users:write
 */
router.patch(
    '/users/me',
    limiters.general,
    authenticate,
    requireScope('users:write'),
    [
        validateString('name', { maxLength: 100 }).optional(),
        validateEmail('email').optional(),
        handleValidationErrors,
    ],
    auditLog,
    async (req, res, next) => {
        try {
            const { name, email } = req.body;
            const user = await prisma.user.update({
                where: { id: req.user.sub },
                data: { name, email },
            });

            res.json({
                ok: true,
                user,
            });

            await invalidateCache(`*users*${req.user.sub}*`);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/users
 * List all users (admin only)
 * Scope: admin
 */
router.get(
    '/users',
    limiters.general,
    authenticate,
    requireScope('admin'),
    cacheMiddleware(30),
    auditLog,
    async (req, res, next) => {
        try {
            const { take = 50, skip = 0 } = req.query;
            const limit = Math.min(Number(take) || 50, 100);
            const offset = Number(skip) || 0;

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                }),
                prisma.user.count(),
            ]);

            res.json({
                ok: true,
                users,
                count: users.length,
                total,
                pagination: { take: limit, skip: offset },
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
