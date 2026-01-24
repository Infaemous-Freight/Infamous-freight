/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Response Caching Middleware
 */

const redis = require('redis');
const { logger } = require('./logger');

let redisClient = null;

// Initialize Redis client
async function initRedis() {
    if (redisClient) return redisClient;

    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 500),
            },
        });

        redisClient.on('error', (err) => logger.error({ err }, 'Redis Client Error'));
        redisClient.on('connect', () => logger.info('Redis connected'));

        await redisClient.connect();
        return redisClient;
    } catch (err) {
        logger.warn({ err: err.message }, 'Redis unavailable, caching disabled');
        return null;
    }
}

// Cache middleware factory
function cacheMiddleware(ttl = 300) {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') return next();

        const client = await initRedis();
        if (!client) return next();

        const cacheKey = `cache:${req.originalUrl || req.path}:${req.user?.sub || 'anonymous'}`;

        try {
            // Try to get from cache
            const cached = await client.get(cacheKey);
            if (cached) {
                res.set('X-Cache', 'HIT');
                return res.json(JSON.parse(cached));
            }
        } catch (err) {
            logger.warn({ err: err.message }, 'Cache read error');
            // Continue on cache miss/error
        }

        // Intercept res.json to cache response
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            if (res.statusCode === 200 && client) {
                client.setEx(cacheKey, ttl, JSON.stringify(data))
                    .catch((err) => logger.warn({ err: err.message }, 'Cache write error'));
            }
            res.set('X-Cache', 'MISS');
            return originalJson(data);
        };

        next();
    };
}

// Cache invalidation helper
async function invalidateCache(pattern = '*') {
    const client = await initRedis();
    if (!client) return;

    try {
        const keys = await client.keys(`cache:${pattern}`);
        if (keys.length > 0) {
            await client.del(keys);
            logger.info({ count: keys.length }, 'Invalidated cache keys');
        }
    } catch (err) {
        logger.error({ err: err.message }, 'Cache invalidation error');
    }
}

module.exports = {
    initRedis,
    cacheMiddleware,
    invalidateCache,
};
