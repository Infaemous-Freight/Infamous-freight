/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Redis Cache Service - Caching layer for API responses, jobs, drivers, pricing
 */

const redis = require('../lib/redis');
const logger = require('../lib/structuredLogging');

class RedisCacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.defaultTTL = 300; // 5 minutes
        this.jobListTTL = 60; // 1 minute for frequently changing job lists
        this.driverStatusTTL = 30; // 30 seconds for driver status
        this.pricingTTL = 3600; // 1 hour for pricing
    }

    async initialize() {
        try {
            this.client = redis.getInstance();
            this.isConnected = true;
            logger.info('Redis cache service initialized');
        } catch (error) {
            logger.error('Redis initialization error', { error: error.message });
        }
    }

    /**
     * Basic get/set operations
     */
    async get(key) {
        try {
            const value = await this.client.getAsync(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.warn('Cache get error', { key, error: error.message });
            return null;
        }
    }

    async set(key, value, expirationSeconds = 300) {
        try {
            await this.client.setAsync(key, JSON.stringify(value), expirationSeconds);
        } catch (error) {
            logger.warn('Cache set error', { key, error: error.message });
        }
    }

    async delete(key) {
        try {
            await this.client.delAsync(key);
        } catch (error) {
            logger.warn('Cache delete error', { key, error: error.message });
        }
    }

    async invalidate(pattern) {
        try {
            const keys = await this.client.keysAsync ?
                await this.client.keysAsync(pattern) : [];
            if (keys.length > 0) {
                for (const key of keys) {
                    await this.client.delAsync(key);
                }
            }
        } catch (error) {
            logger.warn('Cache invalidate error', { pattern, error: error.message });
        }
    }

    /**
     * Job caching
     */
    async getJobsByStatus(status) {
        return this.get(`jobs:status:${status}`);
    }

    async setJobsByStatus(status, jobs) {
        return this.set(`jobs:status:${status}`, jobs, this.jobListTTL);
    }

    async getNearbyJobs(latitude, longitude, radiusKm = 10) {
        const lat = Math.round(latitude * 100) / 100;
        const lng = Math.round(longitude * 100) / 100;
        return this.get(`jobs:nearby:${lat}:${lng}:${radiusKm}`);
    }

    async setNearbyJobs(latitude, longitude, jobs, radiusKm = 10) {
        const lat = Math.round(latitude * 100) / 100;
        const lng = Math.round(longitude * 100) / 100;
        return this.set(`jobs:nearby:${lat}:${lng}:${radiusKm}`, jobs, this.jobListTTL);
    }

    async getJobDetails(jobId) {
        return this.get(`job:${jobId}`);
    }

    async setJobDetails(jobId, job) {
        return this.set(`job:${jobId}`, job, this.jobListTTL);
    }

    async invalidateJobDetails(jobId) {
        return this.delete(`job:${jobId}`);
    }

    /**
     * Driver caching
     */
    async getDriverStatus(driverId) {
        return this.get(`driver:status:${driverId}`);
    }

    async setDriverStatus(driverId, status) {
        return this.set(`driver:status:${driverId}`, status, this.driverStatusTTL);
    }

    async getDriverLocation(driverId) {
        return this.get(`driver:location:${driverId}`);
    }

    async setDriverLocation(driverId, location) {
        return this.set(`driver:location:${driverId}`, location, 10); // 10 second TTL
    }

    async getDriverProfile(driverId) {
        return this.get(`driver:profile:${driverId}`);
    }

    async setDriverProfile(driverId, profile) {
        return this.set(`driver:profile:${driverId}`, profile, 1800);
    }

    /**
     * Pricing caching
     */
    async getPricingCache(distance, minutes, plan) {
        return this.get(`pricing:${distance}:${minutes}:${plan}`);
    }

    async setPricingCache(distance, minutes, plan, price) {
        return this.set(`pricing:${distance}:${minutes}:${plan}`, price, this.pricingTTL);
    }

    /**
     * User preferences caching
     */
    async getUserPreferences(userId) {
        return this.get(`user:preferences:${userId}`);
    }

    async setUserPreferences(userId, preferences) {
        return this.set(`user:preferences:${userId}`, preferences, 3600);
    }

    /**
     * Subscription plans caching
     */
    async getSubscriptionPlans() {
        return this.get('plans:all');
    }

    async setSubscriptionPlans(plans) {
        return this.set('plans:all', plans, this.pricingTTL);
    }

    /**
     * Invalidate related caches when data changes
     */
    async invalidateJobCaches(jobId) {
        await this.delete(`job:${jobId}`);
        await this.invalidate('jobs:status:*');
        logger.info('Invalidated job caches', { jobId });
    }

    async invalidateDriverCaches(driverId) {
        await this.delete(`driver:status:${driverId}`);
        await this.delete(`driver:location:${driverId}`);
        await this.delete(`driver:profile:${driverId}`);
        logger.info('Invalidated driver caches', { driverId });
    }

    async disconnect() {
        if (this.client) {
            try {
                await this.client.disconnectAsync();
                this.isConnected = false;
            } catch (error) {
                logger.error('Cache disconnect error', { error: error.message });
            }
        }
    }
}

// Singleton instance
let instance = null;

function getInstance() {
    if (!instance) {
        instance = new RedisCacheService();
        instance.initialize().catch((err) => {
            logger.error('Cache initialization failed', { error: err.message });
        });
    }
    return instance;
}

module.exports = {
    getInstance,
    RedisCacheService,
    cacheService: getInstance(),
};
