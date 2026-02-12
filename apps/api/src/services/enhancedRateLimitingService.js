/**
 * Enhanced Rate Limiting Service (TIER 1)
 * Per-user tiered rate limiting with Redis backing
 */

const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const redis = require("redis");
const db = require("../db/prisma");

class EnhancedRateLimitingService {
    constructor() {
        this.redisClient = this.initializeRedis();
        this.userTiers = this.defineUserTiers();
    }

    /**
     * Initialize Redis client
     */
    initializeRedis() {
        if (!process.env.REDIS_URL) {
            console.warn("REDIS_URL not configured, rate limiting will be limited");
            return null;
        }

        const client = redis.createClient({
            url: process.env.REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 500),
            },
        });

        client.on("error", (err) => console.error("Redis error:", err));
        client.connect();

        return client;
    }

    /**
     * Define tiered rate limits
     */
    defineUserTiers() {
        return {
            free: {
                requests: 100,
                window: 15 * 60 * 1000,
                aiRequests: 5,
                aiWindow: 60 * 1000,
                description: "Free tier with basic limits",
            },
            pro: {
                requests: 1000,
                window: 15 * 60 * 1000,
                aiRequests: 100,
                aiWindow: 60 * 1000,
                description: "Pro tier with higher limits",
            },
            enterprise: {
                requests: 10000,
                window: 15 * 60 * 1000,
                aiRequests: 1000,
                aiWindow: 60 * 1000,
                description: "Enterprise tier with premium limits",
            },
        };
    }

    /**
     * Get user's tier and cached billing info
     */
    async getUserTier(userId) {
        const cacheKey = `user:tier:${userId}`;

        // Try cache first
        if (this.redisClient) {
            const cached = await this.redisClient.get(cacheKey).catch(() => null);
            if (cached) return cached;
        }

        // Fetch from database
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: { planTier: true },
            });

            const tier = user?.planTier?.toLowerCase() || "free";

            // Cache for 1 hour
            if (this.redisClient) {
                await this.redisClient.setEx(cacheKey, 3600, tier).catch(() => { });
            }

            return tier;
        } catch (err) {
            console.error("Error fetching user tier:", err);
            return "free"; // Default to free on error
        }
    }

    /**
     * Create a per-user API rate limiter
     */
    createUserRateLimiter(tierConfig, windowMs, max) {
        const store = this.redisClient
            ? new RedisStore({
                client: this.redisClient,
                prefix: "ratelimit:",
                expiry: Math.ceil(windowMs / 1000),
            })
            : undefined;

        return rateLimit({
            store,
            windowMs,
            max,
            keyGenerator: (req) => req.user?.id || req.ip,
            handler: (req, res) => {
                res.status(429).json({
                    error: "Too many requests",
                    retryAfter: req.rateLimit?.resetTime,
                    limit: max,
                    window: windowMs / 1000,
                });
            },
            skip: (req) => req.user?.role === "admin",
            standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
            legacyHeaders: false,
        });
    }

    /**
     * Create limiters for different endpoints
     */
    getLimiters() {
        return {
            // General API limiter
            general: this.createUserRateLimiter(
                this.userTiers.free,
                15 * 60 * 1000,
                100
            ),

            // Authentication limiter (stricter)
            auth: rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 5,
                keyGenerator: (req) => req.ip,
                message: "Too many authentication attempts, try again later",
            }),

            // AI/ML expensive operations
            ai: rateLimit({
                windowMs: 1 * 60 * 1000,
                max: 20,
                keyGenerator: (req) => req.user?.id || req.ip,
            }),

            // Billing operations
            billing: rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 30,
                keyGenerator: (req) => req.user?.id || req.ip,
            }),

            // File uploads
            upload: rateLimit({
                windowMs: 60 * 60 * 1000,
                max: 50,
                keyGenerator: (req) => req.user?.id || req.ip,
            }),

            // Exports/Reports (expensive operations)
            export: rateLimit({
                windowMs: 60 * 60 * 1000,
                max: 10,
                keyGenerator: (req) => req.user?.id || req.ip,
            }),
        };
    }

    /**
     * Middleware to apply dynamic per-user rate limiting
     */
    createDynamicRateLimiter() {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    // Unauthenticated users get strict limits
                    return this.getLimiters().general(req, res, next);
                }

                const tier = await this.getUserTier(req.user.id);
                const limits = this.userTiers[tier] || this.userTiers.free;

                const limiter = this.createUserRateLimiter(
                    limits,
                    limits.window,
                    limits.requests
                );

                return limiter(req, res, next);
            } catch (err) {
                console.error("Rate limiting error:", err);
                next(); // Allow on error
            }
        };
    }

    /**
     * Check remaining quota for a user
     */
    async getRemainingQuota(userId, metricType = "api_requests") {
        try {
            const tier = await this.getUserTier(userId);
            const limits = this.userTiers[tier] || this.userTiers.free;

            if (metricType === "ai_requests") {
                return {
                    limit: limits.aiRequests,
                    window: limits.aiWindow,
                    remaining: limits.aiRequests, // Would query usage tracking
                };
            }

            return {
                limit: limits.requests,
                window: limits.window,
                remaining: limits.requests,
            };
        } catch (err) {
            console.error("Error getting quota:", err);
            return { limit: 0, window: 0, remaining: 0 };
        }
    }

    /**
     * Check if user has hit hard cap
     */
    async isHardCapExceeded(userId, usage, metricType = "ai_commands") {
        const tier = await this.getUserTier(userId);
        const hardCap = tier === "free" ? 200 : tier === "pro" ? 500 : 2000;

        return usage > hardCap * 2; // Hard cap at 200% of included
    }

    /**
     * Record rate limit hit for analytics
     */
    async recordRateLimitHit(userId, limitType, exceeded = false) {
        try {
            // Log to monitoring service
            const eventData = {
                userId,
                limitType,
                exceeded,
                timestamp: new Date(),
            };

            // Could send to analytics/monitoring
            console.log("Rate limit hit:", eventData);
        } catch (err) {
            console.error("Error recording rate limit:", err);
        }
    }
}

module.exports = new EnhancedRateLimitingService();
