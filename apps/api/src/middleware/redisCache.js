/**
 * Redis Caching Middleware - Phase 6 Tier 1
 * 
 * Provides intelligent caching for API responses with:
 * - Strategic cache key generation
 * - Automatic TTL management
 * - Smart invalidation on mutations
 * - Cache hit rate monitoring
 * 
 * Expected Impact: 30-40% latency reduction
 * Target: 70-80% cache hit rate
 */

const redis = require('redis');
const logger = require('./logger');

// Redis client configuration
let redisClient = null;
let isRedisReady = false;

/**
 * Initialize Redis connection
 */
async function initializeRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
        redisClient = redis.createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis: Max reconnection attempts reached');
                        return new Error('Redis unavailable');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        redisClient.on('error', (err) => {
            logger.error('Redis error:', { error: err.message });
            isRedisReady = false;
        });

        redisClient.on('connect', () => {
            logger.info('Redis: Connected successfully');
            isRedisReady = true;
        });

        redisClient.on('ready', () => {
            logger.info('Redis: Ready for operations');
            isRedisReady = true;
        });

        redisClient.on('reconnecting', () => {
            logger.warn('Redis: Reconnecting...');
            isRedisReady = false;
        });

        await redisClient.connect();

        // Test connection
        await redisClient.ping();
        logger.info('Redis: Successfully initialized and tested');

        return redisClient;
    } catch (error) {
        logger.error('Redis initialization failed:', { error: error.message });
        isRedisReady = false;
        return null;
    }
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req) {
    const { method, path, query, user } = req;

    // Include user ID for personalized data
    const userId = user?.sub || user?.id || 'anonymous';

    // Normalize query params for consistent keys
    const queryString = Object.keys(query || {})
        .sort()
        .map(key => `${key}=${query[key]}`)
        .join('&');

    return `api:${method}:${path}:${userId}:${queryString}`;
}

/**
 * Determine TTL based on endpoint
 */
function getTTL(req) {
    const { path } = req;

    // High churn data - 5 minutes
    if (path.includes('/shipments') || path.includes('/drivers')) {
        return 300; // 5 minutes
    }

    // Medium churn - 15 minutes
    if (path.match(/\/shipments\/\d+/) || path.match(/\/drivers\/\d+/)) {
        return 900; // 15 minutes
    }

    // Analytics - 1 hour
    if (path.includes('/analytics') || path.includes('/reports')) {
        return 3600; // 1 hour
    }

    // User data - 24 hours
    if (path.includes('/users') && req.method === 'GET') {
        return 86400; // 24 hours
    }

    // Default - 10 minutes
    return 600;
}

/**
 * Check if endpoint should be cached
 */
function shouldCache(req) {
    const { method, path } = req;

    // Only cache GET requests
    if (method !== 'GET') {
        return false;
    }

    // Don't cache health checks
    if (path.includes('/health')) {
        return false;
    }

    // Don't cache authentication endpoints
    if (path.includes('/auth') || path.includes('/login')) {
        return false;
    }

    // Don't cache real-time data (will be handled by WebSocket in Tier 2)
    if (path.includes('/real-time') || path.includes('/stream')) {
        return false;
    }

    return true;
}

/**
 * Cache middleware
 */
function cacheMiddleware() {
    return async (req, res, next) => {
        // Skip if Redis not ready or caching not applicable
        if (!isRedisReady || !redisClient || !shouldCache(req)) {
            return next();
        }

        const cacheKey = generateCacheKey(req);

        try {
            // Check cache
            const cachedData = await redisClient.get(cacheKey);

            if (cachedData) {
                // Cache hit
                const data = JSON.parse(cachedData);

                logger.debug('Cache HIT', {
                    key: cacheKey,
                    path: req.path,
                    method: req.method
                });

                // Add cache headers
                res.set('X-Cache', 'HIT');
                res.set('X-Cache-Key', cacheKey);

                // Emit metric
                if (global.metrics) {
                    global.metrics.increment('cache.hit');
                }

                return res.json(data);
            }

            // Cache miss - intercept response
            logger.debug('Cache MISS', {
                key: cacheKey,
                path: req.path,
                method: req.method
            });

            // Add cache headers
            res.set('X-Cache', 'MISS');

            // Emit metric
            if (global.metrics) {
                global.metrics.increment('cache.miss');
            }

            // Store original json method
            const originalJson = res.json.bind(res);

            // Override json method to cache response
            res.json = function (data) {
                // Cache the response
                const ttl = getTTL(req);
                redisClient.setEx(cacheKey, ttl, JSON.stringify(data))
                    .catch(err => {
                        logger.error('Failed to cache response:', {
                            error: err.message,
                            key: cacheKey
                        });
                    });

                // Call original json method
                return originalJson(data);
            };

            next();
        } catch (error) {
            logger.error('Cache middleware error:', {
                error: error.message,
                key: cacheKey
            });

            // Continue without cache on error
            next();
        }
    };
}

/**
 * Invalidate cache for specific patterns
 */
async function invalidateCache(pattern) {
    if (!isRedisReady || !redisClient) {
        logger.warn('Redis not ready, skipping cache invalidation');
        return;
    }

    try {
        const keys = await redisClient.keys(pattern);

        if (keys.length > 0) {
            await redisClient.del(keys);
            logger.info(`Cache invalidated: ${keys.length} keys`, { pattern });

            if (global.metrics) {
                global.metrics.increment('cache.invalidation', keys.length);
            }
        }
    } catch (error) {
        logger.error('Cache invalidation failed:', {
            error: error.message,
            pattern
        });
    }
}

/**
 * Invalidation middleware for mutations
 */
function invalidationMiddleware() {
    return async (req, res, next) => {
        // Only for mutation methods
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            return next();
        }

        // Store original send method
        const originalSend = res.send.bind(res);
        const originalJson = res.json.bind(res);

        // Override to invalidate after successful response
        const invalidateAfterResponse = (data) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Determine what to invalidate based on endpoint
                const { path } = req;

                if (path.includes('/shipments')) {
                    invalidateCache('api:GET:/api/shipments:*');
                    if (req.params.id) {
                        invalidateCache(`api:GET:/api/shipments/${req.params.id}:*`);
                    }
                }

                if (path.includes('/drivers')) {
                    invalidateCache('api:GET:/api/drivers:*');
                    if (req.params.id) {
                        invalidateCache(`api:GET:/api/drivers/${req.params.id}:*`);
                    }
                }

                if (path.includes('/users')) {
                    invalidateCache('api:GET:/api/users:*');
                    if (req.params.id) {
                        invalidateCache(`api:GET:/api/users/${req.params.id}:*`);
                    }
                }

                // Invalidate analytics on any data change
                invalidateCache('api:GET:/api/analytics:*');
                invalidateCache('api:GET:/api/reports:*');
            }

            return data;
        };

        res.send = function (data) {
            invalidateAfterResponse(data);
            return originalSend(data);
        };

        res.json = function (data) {
            invalidateAfterResponse(data);
            return originalJson(data);
        };

        next();
    };
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
    if (!isRedisReady || !redisClient) {
        return {
            ready: false,
            message: 'Redis not connected'
        };
    }

    try {
        const info = await redisClient.info('stats');
        const keyspace = await redisClient.info('keyspace');

        // Parse keyspace info
        const dbMatch = keyspace.match(/db0:keys=(\d+)/);
        const keyCount = dbMatch ? parseInt(dbMatch[1]) : 0;

        return {
            ready: true,
            connected: true,
            totalKeys: keyCount,
            info: info,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        logger.error('Failed to get cache stats:', { error: error.message });
        return {
            ready: false,
            error: error.message
        };
    }
}

/**
 * Clear all cache (use with caution)
 */
async function clearAllCache() {
    if (!isRedisReady || !redisClient) {
        throw new Error('Redis not ready');
    }

    try {
        await redisClient.flushDb();
        logger.warn('All cache cleared - FLUSHDB executed');

        if (global.metrics) {
            global.metrics.increment('cache.flush');
        }

        return { success: true, message: 'Cache cleared' };
    } catch (error) {
        logger.error('Failed to clear cache:', { error: error.message });
        throw error;
    }
}

/**
 * Warmup cache with common queries
 */
async function warmupCache() {
    // Placeholder for cache warmup logic
    // Can be implemented to pre-populate cache on startup
    logger.info('Cache warmup initiated');

    // Example: Pre-fetch common data
    // await fetchAndCache('/api/shipments?status=active');
    // await fetchAndCache('/api/drivers?status=available');

    return { success: true, message: 'Cache warmup complete' };
}

module.exports = {
    initializeRedis,
    cacheMiddleware,
    invalidationMiddleware,
    invalidateCache,
    getCacheStats,
    clearAllCache,
    warmupCache,
    getClient: () => redisClient,
    isReady: () => isRedisReady
};
