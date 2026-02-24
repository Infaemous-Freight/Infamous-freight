/**
 * Cache Management Routes - Phase 6 Tier 1
 * 
 * Admin endpoints for cache monitoring and management
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireScope } = require('../middleware/security');
const {
    getCacheStats,
    clearAllCache,
    invalidateCache,
    warmupCache,
    isReady
} = require('../middleware/redisCache');
const { ApiResponse, HTTP_STATUS } = require('@infamous-freight/shared');

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
router.get('/stats',
    authenticate,
    requireScope('admin:read'),
    async (req, res, next) => {
        try {
            const stats = await getCacheStats();

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: stats,
                    message: 'Cache statistics retrieved'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/cache/clear
 * Clear all cache (admin only)
 */
router.post('/clear',
    authenticate,
    requireScope('admin:write'),
    async (req, res, next) => {
        try {
            const result = await clearAllCache();

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: result,
                    message: 'Cache cleared successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/cache/invalidate
 * Invalidate specific cache pattern
 */
router.post('/invalidate',
    authenticate,
    requireScope('admin:write'),
    async (req, res, next) => {
        try {
            const { pattern } = req.body;

            if (!pattern) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ApiResponse({
                        success: false,
                        message: 'Pattern is required'
                    })
                );
            }

            await invalidateCache(pattern);

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    message: `Cache invalidated for pattern: ${pattern}`
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/cache/warmup
 * Warmup cache with common queries
 */
router.post('/warmup',
    authenticate,
    requireScope('admin:write'),
    async (req, res, next) => {
        try {
            const result = await warmupCache();

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: result,
                    message: 'Cache warmup initiated'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/cache/health
 * Check cache health status
 */
router.get('/health', async (req, res) => {
    const ready = isReady();
    const status = ready ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

    res.status(status).json(
        new ApiResponse({
            success: ready,
            data: { ready, timestamp: new Date().toISOString() },
            message: ready ? 'Cache is healthy' : 'Cache is not ready'
        })
    );
});

module.exports = router;
