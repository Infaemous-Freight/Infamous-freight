/**
 * Redis-backed Rate Limiting Middleware
 * Enables distributed rate limiting across multiple API instances
 * 
 * Usage:
 * router.post('/action', rateLimitRedis.ai, authenticate, handler);
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');

// Initialize Redis client
const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            const delay = Math.min(retries * 50, 1000);
            console.info(`Redis reconnection attempt ${retries}, retrying in ${delay}ms`);
            return delay;
        },
    },
});

// Handle Redis connection
redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
});

redisClient.on('connect', () => {
    console.info('Redis client connected');
});

// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        console.warn('Rate limiting will fall back to in-memory storage (not recommended for production)');
    }
})();

/**
 * Enhanced Rate Limiters with Redis Store
 * 
 * @type {Object} rateLimiters - Map of rate limiter instances for different use cases
 */
module.exports.rateLimiters = {
    /**
     * General API rate limiting
     * 100 requests per 15 minutes
     */
    general: rateLimit({
        store: new RedisStore({
            client: redisClient,
            prefix: 'rl:general:',
        }),
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: 'Too many requests from this IP, please try again later',
        standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
        legacyHeaders: false, // Disable `X-RateLimit-*` headers
        skip: (req) => {
            // Skip rate limiting for health checks
            return req.path === '/api/health';
        },
    }),

    /**
     * Authentication rate limiting
     * 5 requests per 15 minutes (stricter for login attempts)
     */
    auth: rateLimit({
        store: new RedisStore({
            client: redisClient,
            prefix: 'rl:auth:',
        }),
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many login attempts, please try again after 15 minutes',
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            // Rate limit by username if available, otherwise by IP
            return req.body?.email || req.ip;
        },
    }),

    /**
     * AI command rate limiting
     * 20 requests per minute (heavy operations)
     */
    ai: rateLimit({
        store: new RedisStore({
            client: redisClient,
            prefix: 'rl:ai:',
        }),
        windowMs: 60 * 1000, // 1 minute
        max: 20,
        message: 'AI rate limit exceeded. Maximum 20 requests per minute',
        standardHeaders: true,
        legacyHeaders: false,
    }),

    /**
     * Billing operations rate limiting
     * 30 requests per 15 minutes
     */
    billing: rateLimit({
        store: new RedisStore({
            client: redisClient,
            prefix: 'rl:billing:',
        }),
        windowMs: 15 * 60 * 1000,
        max: 30,
        message: 'Billing rate limit exceeded',
        standardHeaders: true,
        legacyHeaders: false,
    }),

    /**
     * Voice processing rate limiting
     * 10 requests per minute
     */
    voice: rateLimit({
        store: new RedisStore({
            client: redisClient,
            prefix: 'rl:voice:',
        }),
        windowMs: 60 * 1000, // 1 minute
        max: 10,
        message: 'Voice processing rate limit exceeded. Maximum 10 uploads per minute',
        standardHeaders: true,
        legacyHeaders: false,
    }),

    /**
     * Export operations rate limiting
     * 5 requests per hour (expensive queries)
     */
    exports: rateLimit({
        store: new RedisStore({
            client: redisClient,
            prefix: 'rl:exports:',
        }),
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5,
        message: 'Export rate limit exceeded. Maximum 5 exports per hour',
        standardHeaders: true,
        legacyHeaders: false,
    }),

    /**
     * Password reset rate limiting
     * 3 requests per 24 hours (security-critical)
     */
    passwordReset: rateLimit({
        store: new RedisStore({
            client: redisClient,
            prefix: 'rl:password-reset:',
        }),
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: 3,
        message: 'Too many password reset attempts. Please try again in 24 hours',
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            // Rate limit by email address
            return req.body?.email || req.ip;
        },
    }),

    /**
     * Webhook operations rate limiting
     * 100 requests per minute (for webhook processing)
     */
    webhooks: rateLimit({
        store: new RedisStore({
            client: redisClient,
            prefix: 'rl:webhooks:',
        }),
        windowMs: 60 * 1000, // 1 minute
        max: 100,
        message: 'Webhook rate limit exceeded',
        standardHeaders: true,
        legacyHeaders: false,
    }),
};

/**
 * Custom rate limiting helper for dynamic limits
 * Usage: await checkRateLimit('api-key', 10, 60)
 * 
 * @param {string} key - Unique key for rate limiting (user ID, API key, etc.)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowSeconds - Window in seconds
 * @returns {Promise<{allowed: boolean, remaining: number, resetTime: number}>}
 */
module.exports.checkRateLimit = async (key, maxRequests, windowSeconds) => {
    try {
        const redisKey = `rl:custom:${key}`;
        const now = Math.floor(Date.now() / 1000);
        const windowStart = now - windowSeconds;

        // Get count of requests in window
        const count = await redisClient.incr(redisKey);

        // Set expiration on first request
        if (count === 1) {
            await redisClient.expire(redisKey, windowSeconds);
        }

        const allowed = count <= maxRequests;
        const resetTime = now + (await redisClient.ttl(redisKey));

        return {
            allowed,
            remaining: Math.max(0, maxRequests - count),
            resetTime,
            count,
        };
    } catch (err) {
        console.error('Rate limit check failed:', err);
        // Fail open - allow request if Redis is down
        return { allowed: true, remaining: -1, resetTime: 0, error: err };
    }
};

/**
 * Graceful Redis client closure
 */
module.exports.closeRedisConnection = async () => {
    try {
        await redisClient.quit();
        console.info('Redis connection closed');
    } catch (err) {
        console.error('Error closing Redis connection:', err);
    }
};

/**
 * Get current rate limiting statistics
 * Useful for monitoring and debugging
 */
module.exports.getRateLimitStats = async (prefix) => {
    try {
        const pattern = `rl:${prefix || '*'}`;
        const keys = await redisClient.keys(pattern);

        const stats = {};
        for (const key of keys) {
            const ttl = await redisClient.ttl(key);
            const count = await redisClient.get(key);
            stats[key] = { count: parseInt(count || 0), ttl };
        }

        return stats;
    } catch (err) {
        console.error('Failed to get rate limit stats:', err);
        return {};
    }
};
