/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Redis Client & Cache Management
 */

const redis = require('redis');
const { env } = require('../config/env');

// Create Redis client
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('End of retry.');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('End of retry.');
        }
        if (options.attempt > 10) {
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    },
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
    console.info('Redis connected');
});

// Webhook deduplication
class WebhookDeduplicator {
    constructor(client) {
        this.client = client;
        this.ttl = 86400; // 24 hours
    }

    async isDuplicate(eventId) {
        try {
            const key = `webhook:${eventId}`;
            const exists = await this.client.exists(key);
            if (!exists) {
                await this.client.setex(key, this.ttl, '1');
            }
            return !!exists;
        } catch (err) {
            console.error('Webhook dedup check failed:', err);
            // On error, assume not duplicate to avoid blocking
            return false;
        }
    }

    async markProcessed(eventId) {
        try {
            const key = `webhook:${eventId}`;
            await this.client.setex(key, this.ttl, '1');
        } catch (err) {
            console.error('Failed to mark webhook as processed:', err);
        }
    }

    async cleanup() {
        // Redis handles TTL automatically with SETEX
        // No manual cleanup needed
    }
}

// Cache manager for job listings, pricing, etc
class CacheManager {
    constructor(client) {
        this.client = client;
    }

    // Job listings cache (5 minutes)
    async getJobsByLocation(lat, lng, maxMiles) {
        try {
            const key = `jobs:location:${lat}:${lng}:${maxMiles}`;
            const cached = await this.client.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (err) {
            console.warn('Cache get failed:', err);
            return null;
        }
    }

    async setJobsByLocation(lat, lng, maxMiles, jobs) {
        try {
            const key = `jobs:location:${lat}:${lng}:${maxMiles}`;
            await this.client.setex(key, 300, JSON.stringify(jobs)); // 5 minutes
        } catch (err) {
            console.warn('Cache set failed:', err);
        }
    }

    // Driver availability cache (30 seconds)
    async getDriverStatus(driverId) {
        try {
            const key = `driver:${driverId}:status`;
            const cached = await this.client.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (err) {
            console.warn('Cache get failed:', err);
            return null;
        }
    }

    async setDriverStatus(driverId, status) {
        try {
            const key = `driver:${driverId}:status`;
            await this.client.setex(key, 30, JSON.stringify(status)); // 30 seconds
        } catch (err) {
            console.warn('Cache set failed:', err);
        }
    }

    // Pricing rules cache (1 hour)
    async getPricingRules() {
        try {
            const key = 'pricing:rules';
            const cached = await this.client.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (err) {
            console.warn('Cache get failed:', err);
            return null;
        }
    }

    async setPricingRules(rules) {
        try {
            const key = 'pricing:rules';
            await this.client.setex(key, 3600, JSON.stringify(rules)); // 1 hour
        } catch (err) {
            console.warn('Cache set failed:', err);
        }
    }

    // User subscription cache (10 minutes)
    async getUserSubscription(userId) {
        try {
            const key = `user:${userId}:subscription`;
            const cached = await this.client.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (err) {
            console.warn('Cache get failed:', err);
            return null;
        }
    }

    async setUserSubscription(userId, subscription) {
        try {
            const key = `user:${userId}:subscription`;
            await this.client.setex(key, 600, JSON.stringify(subscription)); // 10 minutes
        } catch (err) {
            console.warn('Cache set failed:', err);
        }
    }

    // Invalidate specific cache
    async invalidate(key) {
        try {
            await this.client.del(key);
        } catch (err) {
            console.warn('Cache invalidation failed:', err);
        }
    }

    // Invalidate by pattern (expensive, use sparingly)
    async invalidatePattern(pattern) {
        try {
            const keys = await new Promise((resolve, reject) => {
                this.client.keys(pattern, (err, keys) => {
                    if (err) reject(err);
                    else resolve(keys || []);
                });
            });

            if (keys.length > 0) {
                await new Promise((resolve, reject) => {
                    this.client.del(...keys, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        } catch (err) {
            console.warn('Pattern invalidation failed:', err);
        }
    }

    // Clear all cache (use carefully)
    async flushAll() {
        try {
            await this.client.flushdb();
        } catch (err) {
            console.error('Failed to flush cache:', err);
        }
    }
}

// Session manager for JWT token blacklisting
class SessionManager {
    constructor(client) {
        this.client = client;
    }

    // Blacklist token on logout
    async blacklistToken(token, expiresIn) {
        try {
            const key = `token:blacklist:${token}`;
            await this.client.setex(key, expiresIn, '1');
        } catch (err) {
            console.warn('Token blacklist failed:', err);
        }
    }

    // Check if token is blacklisted
    async isTokenBlacklisted(token) {
        try {
            const key = `token:blacklist:${token}`;
            const exists = await this.client.exists(key);
            return !!exists;
        } catch (err) {
            console.warn('Token blacklist check failed:', err);
            return false;
        }
    }
}

// Initialize instances
const deduplicator = new WebhookDeduplicator(redisClient);
const cacheManager = new CacheManager(redisClient);
const sessionManager = new SessionManager(redisClient);

// Graceful shutdown
process.on('SIGTERM', () => {
    redisClient.quit(() => {
        console.info('Redis connection closed');
    });
});

module.exports = {
    redisClient,
    deduplicator,
    cacheManager,
    sessionManager,
};
