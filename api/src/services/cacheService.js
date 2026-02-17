// api/src/services/cacheService.js
// Week 3: Advanced Redis Caching Layer
// Multi-level caching with TTL, patterns, and invalidation

const Redis = require("ioredis");
const logger = require("../middleware/logger");

class CacheService {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });

        this.redis.on("error", (err) => {
            logger.error("Redis connection error", { error: err.message });
        });

        this.redis.on("connect", () => {
            logger.info("Redis connected successfully");
        });

        // Cache TTL configurations (in seconds)
        this.TTL = {
            SHORT: 60, // 1 minute
            MEDIUM: 300, // 5 minutes
            LONG: 1800, // 30 minutes
            VERY_LONG: 3600, // 1 hour
        };

        // Cache key prefixes
        this.PREFIX = {
            SHIPMENT: "shipment:",
            SHIPMENT_LIST: "shipments:list:",
            USER: "user:",
            DRIVER: "driver:",
            STATS: "stats:",
            SEARCH: "search:",
        };
    }

    /**
     * Generate cache key with prefix
     */
    generateKey(prefix, identifier) {
        return `${prefix}${identifier}`;
    }

    /**
     * Get value from cache
     */
    async get(key) {
        try {
            const value = await this.redis.get(key);
            if (value) {
                return JSON.parse(value);
            }
            return null;
        } catch (error) {
            logger.error("Cache get error", { key, error: error.message });
            return null;
        }
    }

    /**
     * Set value in cache with TTL
     */
    async set(key, value, ttl = this.TTL.MEDIUM) {
        try {
            await this.redis.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error("Cache set error", { key, error: error.message });
            return false;
        }
    }

    /**
     * Delete single key
     */
    async del(key) {
        try {
            await this.redis.del(key);
            return true;
        } catch (error) {
            logger.error("Cache delete error", { key, error: error.message });
            return false;
        }
    }

    /**
     * Delete keys by pattern
     */
    async delPattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                logger.info("Cache pattern deleted", { pattern, count: keys.length });
            }
            return true;
        } catch (error) {
            logger.error("Cache pattern delete error", {
                pattern,
                error: error.message,
            });
            return false;
        }
    }

    /**
     * Get or set pattern - fetch from cache or execute function and cache result
     */
    async getOrSet(key, fetchFunction, ttl = this.TTL.MEDIUM) {
        try {
            // Try to get from cache first
            const cached = await this.get(key);
            if (cached !== null) {
                logger.debug("Cache hit", { key });
                return cached;
            }

            // Cache miss - fetch data
            logger.debug("Cache miss", { key });
            const data = await fetchFunction();

            // Store in cache
            if (data !== null && data !== undefined) {
                await this.set(key, data, ttl);
            }

            return data;
        } catch (error) {
            logger.error("Cache getOrSet error", { key, error: error.message });
            // If caching fails, still return the fetched data
            return await fetchFunction();
        }
    }

    /**
     * Cache shipment
     */
    async cacheShipment(shipment) {
        const key = this.generateKey(this.PREFIX.SHIPMENT, shipment.id);
        return await this.set(key, shipment, this.TTL.MEDIUM);
    }

    /**
     * Get shipment from cache
     */
    async getShipment(id) {
        const key = this.generateKey(this.PREFIX.SHIPMENT, id);
        return await this.get(key);
    }

    /**
     * Invalidate shipment cache
     */
    async invalidateShipment(id) {
        const key = this.generateKey(this.PREFIX.SHIPMENT, id);
        await this.del(key);
        // Also invalidate lists that might contain this shipment
        await this.delPattern(`${this.PREFIX.SHIPMENT_LIST}*`);
    }

    /**
     * Cache shipment list with query parameters
     */
    async cacheShipmentList(query, data) {
        const queryString = JSON.stringify(query);
        const key = this.generateKey(this.PREFIX.SHIPMENT_LIST, queryString);
        return await this.set(key, data, this.TTL.SHORT);
    }

    /**
     * Get shipment list from cache
     */
    async getShipmentList(query) {
        const queryString = JSON.stringify(query);
        const key = this.generateKey(this.PREFIX.SHIPMENT_LIST, queryString);
        return await this.get(key);
    }

    /**
     * Cache user data
     */
    async cacheUser(user) {
        const key = this.generateKey(this.PREFIX.USER, user.id);
        // Don't cache password
        const { password, ...safeUser } = user;
        return await this.set(key, safeUser, this.TTL.LONG);
    }

    /**
     * Get user from cache
     */
    async getUser(id) {
        const key = this.generateKey(this.PREFIX.USER, id);
        return await this.get(key);
    }

    /**
     * Invalidate user cache
     */
    async invalidateUser(id) {
        const key = this.generateKey(this.PREFIX.USER, id);
        return await this.del(key);
    }

    /**
     * Cache statistics
     */
    async cacheStats(type, data) {
        const key = this.generateKey(this.PREFIX.STATS, type);
        return await this.set(key, data, this.TTL.VERY_LONG);
    }

    /**
     * Get statistics from cache
     */
    async getStats(type) {
        const key = this.generateKey(this.PREFIX.STATS, type);
        return await this.get(key);
    }

    /**
     * Increment counter
     */
    async incr(key) {
        try {
            return await this.redis.incr(key);
        } catch (error) {
            logger.error("Cache incr error", { key, error: error.message });
            return 0;
        }
    }

    /**
     * Set expiration on key
     */
    async expire(key, seconds) {
        try {
            return await this.redis.expire(key, seconds);
        } catch (error) {
            logger.error("Cache expire error", { key, error: error.message });
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStats() {
        try {
            const info = await this.redis.info("stats");
            const memory = await this.redis.info("memory");

            return {
                connected: this.redis.status === "ready",
                uptime: this.redis.uptime,
                stats: this.parseRedisInfo(info),
                memory: this.parseRedisInfo(memory),
            };
        } catch (error) {
            logger.error("Error getting cache stats", { error: error.message });
            return null;
        }
    }

    /**
     * Parse Redis INFO command output
     */
    parseRedisInfo(info) {
        const lines = info.split("\r\n");
        const result = {};

        lines.forEach((line) => {
            if (line && !line.startsWith("#")) {
                const [key, value] = line.split(":");
                if (key && value) {
                    result[key] = value;
                }
            }
        });

        return result;
    }

    /**
     * Flush all cache (use with caution!)
     */
    async flushAll() {
        try {
            await this.redis.flushall();
            logger.warn("Cache flushed - all keys deleted");
            return true;
        } catch (error) {
            logger.error("Cache flush error", { error: error.message });
            return false;
        }
    }

    /**
     * Close Redis connection
     */
    async disconnect() {
        await this.redis.quit();
    }
}

// Export singleton instance
module.exports = new CacheService();
