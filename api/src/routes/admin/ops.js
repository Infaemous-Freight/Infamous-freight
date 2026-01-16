const express = require("express");
const os = require("os");
const { authenticate, auditLog, rateLimitMetrics } = require("../../middleware/security");
const { requirePerm } = require("../../auth/authorize");
const { prisma, getPrisma } = require("../../db/prisma");
const { getSlowQueries } = require("../../lib/queryMetrics");

const router = express.Router();

function requireAdmin(req, res, next) {
    if (req.user?.role === 'admin') return next();
    return res.status(403).json({ error: 'Admin access required' });
}

router.get(
    "/admin/health/full",
    authenticate,
    requireAdmin,
    requirePerm("admin:ops"),
    auditLog,
    async (_req, res) => {
        const details = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || 'unknown',
            commit: process.env.GITHUB_SHA,
            uptimeSeconds: Math.round(process.uptime()),
            services: {},
            system: {
                platform: os.platform(),
                arch: os.arch(),
                cpuCores: os.cpus().length,
                loadAverage: os.loadavg(),
                freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
                totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
            },
        };

        // Database check
        try {
            const client = getPrisma?.() || prisma;
            if (client) {
                const dbStart = Date.now();
                await client.$queryRaw`SELECT 1`;
                details.services.database = {
                    status: 'healthy',
                    responseTimeMs: Date.now() - dbStart,
                };
            } else {
                details.services.database = {
                    status: 'skipped',
                    note: 'Prisma not initialized (persistenceMode=json?)',
                };
            }
        } catch (error) {
            details.status = 'degraded';
            details.services.database = {
                status: 'unhealthy',
                error: error.message,
            };
        }

        res.status(details.status === 'ok' ? 200 : 503).json(details);
    },
);

router.get(
    "/admin/rate-limits",
    authenticate,
    requireAdmin,
    auditLog,
    (_req, res) => {
        res.json({ stats: rateLimitMetrics.snapshot() });
    },
);

router.get(
    "/admin/database/slow-queries",
    authenticate,
    requireAdmin,
    auditLog,
    (_req, res) => {
        res.json({ slowQueries: getSlowQueries(50) });
    },
);

module.exports = router;
