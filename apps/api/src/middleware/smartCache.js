/*
 * Smart Response Caching
 *
 * Implements intelligent HTTP caching with Cache-Control headers
 * and response body caching based on route patterns
 */

const crypto = require('crypto');
const { logger } = require('./logger');
const config = require('../config/loadenv');

/**
 * Cache control policies by route pattern
 */
const cacheControlPolicies = {
    // Public data - can be cached
    'GET /api/shipments/tracking/:id': { cacheControl: 'public, max-age=60', ttl: 60 },
    'GET /api/shipments/:id': { cacheControl: 'private, max-age=30', ttl: 30 },
    'GET /api/shipments': { cacheControl: 'private, max-age=15', ttl: 15 },

    // User-specific data - private
    'GET /api/users/profile': { cacheControl: 'private, max-age=0', ttl: 0 },
    'GET /api/users/:id': { cacheControl: 'private, max-age=0', ttl: 0 },

    // Rate/lookup data - can be cached longer
    'GET /api/rates': { cacheControl: 'public, max-age=3600', ttl: 3600 },
    'GET /api/services': { cacheControl: 'public, max-age=1800', ttl: 1800 },

    // No cache for state-changing operations
    'POST /api/*': { cacheControl: 'no-cache, no-store, must-revalidate', ttl: 0 },
    'PATCH /api/*': { cacheControl: 'no-cache, no-store, must-revalidate', ttl: 0 },
    'DELETE /api/*': { cacheControl: 'no-cache, no-store, must-revalidate', ttl: 0 },

    // Default policy
    default: { cacheControl: 'private, max-age=0', ttl: 0 },
};

/**
 * In-memory cache for response bodies
 */
class ResponseCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }

    /**
     * Generate cache key from request
     */
    generateKey(req) {
        const user = req.user?.sub || 'anonymous';
        const path = req.originalUrl || req.path;
        return `${user}:${path}`;
    }

    /**
     * Get cached response
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * Set cached response
     */
    set(key, value, ttl) {
        this.cache.set(key, value);

        // Clear existing timer
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Set expiration
        if (ttl > 0) {
            const timer = setTimeout(() => {
                this.cache.delete(key);
                this.timers.delete(key);
            }, ttl * 1000);

            this.timers.set(key, timer);
        }
    }

    /**
     * Invalidate cache entries matching pattern
     */
    invalidate(pattern) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.match(pattern)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach((key) => {
            this.cache.delete(key);
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
                this.timers.delete(key);
            }
        });
        return keysToDelete.length;
    }

    /**
     * Get cache stats
     */
    stats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.forEach((_, key) => {
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
            }
        });
        this.cache.clear();
        this.timers.clear();
    }
}

const responseCache = new ResponseCache();

/**
 * Find matching cache policy
 */
function findCachePolicy(method, path) {
    const pathPattern = `${method} ${path}`;

    for (const [pattern, policy] of Object.entries(cacheControlPolicies)) {
        if (pattern === 'default') continue;

        // Convert pattern to regex (handle wildcards and variables)
        const regex = new RegExp(
            `^${pattern
                .replace(/\*/g, '.*')
                .replace(/:\w+/g, '[^/]+')
                .replace(/\//g, '\\/')}$`
        );

        if (regex.test(pathPattern)) {
            return policy;
        }
    }

    return cacheControlPolicies.default;
}

/**
 * Smart caching middleware
 */
function smartCacheMiddleware(req, res, next) {
    if (config.NODE_ENV === 'test') return next();

    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const policy = findCachePolicy(req.method, req.path);
    const cacheKey = responseCache.generateKey(req);

    // Set Cache-Control header
    res.set('Cache-Control', policy.cacheControl);

    // Check cache
    if (policy.ttl > 0 && !req.headers['cache-control']?.includes('no-cache')) {
        const cached = responseCache.get(cacheKey);
        if (cached) {
            res.set('X-Cache', 'HIT');
            return res.json(cached);
        }
    }

    // Mark cache as MISS
    res.set('X-Cache', 'MISS');

    // Override json to cache response
    const originalJson = res.json.bind(res);
    res.json = function (data) {
        if (res.statusCode === 200 && policy.ttl > 0) {
            responseCache.set(cacheKey, data, policy.ttl);
        }
        return originalJson(data);
    };

    next();
}

/**
 * Cache invalidation middleware
 *
 * Automatically invalidate related cache entries on state changes
 */
function cacheInvalidationMiddleware(req, res, next) {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
        // On success, invalidate related cache
        if (res.statusCode >= 200 && res.statusCode < 300) {
            if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE') {
                // Extract resource type and ID if applicable
                const pathMatch = req.path.match(/\/api\/(\w+)s?(\/[^/]+)?/);
                if (pathMatch) {
                    const resource = pathMatch[1];
                    const invalidatePattern = new RegExp(`.*/${resource}.*`);
                    const invalidated = responseCache.invalidate(invalidatePattern);

                    if (invalidated > 0) {
                        logger.debug(
                            { invalidated, resource },
                            'Cache invalidated after mutation'
                        );
                    }
                }
            }
        }

        return originalJson(data);
    };

    next();
}

/**
 * Endpoint to check/clear cache (admin only)
 */
function cacheManagementRoute(router) {
    router.get('/api/admin/cache/stats', (req, res) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        res.json({ cache: responseCache.stats() });
    });

    router.delete('/api/admin/cache/clear', (req, res) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        responseCache.clear();
        res.json({ message: 'Cache cleared' });
    });
}

module.exports = {
    smartCacheMiddleware,
    cacheInvalidationMiddleware,
    cacheManagementRoute,
    responseCache,
};
