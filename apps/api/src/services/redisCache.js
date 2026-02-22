/**
 * Redis Caching Service
 * Distributed cache layer for frequently accessed data
 *
 * @module services/redisCache
 * @requires redis
 */

const redis = require("redis");
const logger = require("../middleware/logger");

/**
 * Redis Cache Manager
 * Handles caching, invalidation, and TTL management
 */
class RedisCache {
  constructor(url = process.env.REDIS_URL || "redis://localhost:6379") {
    this.url = url;
    this.client = null;
    this.connected = false;
    this.defaultTTL = 3600; // 1 hour
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };

    // Cache configuration by entity type
    this.cacheConfig = {
      shipment: {
        ttl: 600, // 10 minutes
        pattern: "shipment:*",
        invalidateOn: ["shipment.created", "shipment.updated", "shipment.deleted"],
      },
      driver: {
        ttl: 900, // 15 minutes
        pattern: "driver:*",
        invalidateOn: ["driver.created", "driver.updated", "driver.deleted"],
      },
      user: {
        ttl: 1800, // 30 minutes
        pattern: "user:*",
        invalidateOn: ["user.created", "user.updated", "user.deleted"],
      },
      invoice: {
        ttl: 600, // 10 minutes
        pattern: "invoice:*",
        invalidateOn: ["invoice.created", "invoice.updated", "invoice.deleted"],
      },
      search: {
        ttl: 300, // 5 minutes for search queries
        pattern: "search:*",
      },
      session: {
        ttl: 3600, // 1 hour
        pattern: "session:*",
      },
    };
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (this.connected) return;

    try {
      this.client = redis.createClient({
        url: this.url,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      this.client.on("error", (err) => this.handleError(err));
      this.client.on("connect", () => {
        logger.info("Redis connected");
        this.connected = true;
      });

      await this.client.connect();

      // Test connection
      await this.client.ping();
      this.connected = true;
      logger.info("Redis connection verified");
    } catch (error) {
      logger.error("Redis connection failed", { error: error.message });
      this.connected = false;
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (!this.client) return;

    try {
      await this.client.disconnect();
      this.connected = false;
      logger.info("Redis disconnected");
    } catch (error) {
      logger.error("Redis disconnect error", { error: error.message });
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.isConnected()) return null;

    try {
      const value = await this.client.get(key);

      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key, value, ttl = null) {
    if (!this.isConnected()) return false;

    try {
      const ttlSeconds = ttl || this.defaultTTL;
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      this.stats.sets++;
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  /**
   * Get or compute value
   */
  async getOrCompute(key, computeFn, ttl = null) {
    // Try cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const value = await computeFn();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Delete key(s) from cache
   */
  async delete(key) {
    if (!this.isConnected()) return false;

    try {
      const result = await this.client.del(key);
      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern) {
    if (!this.isConnected()) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return true;

      await this.client.del(keys);
      this.stats.deletes += keys.length;
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  /**
   * Invalidate cache for entity type
   */
  async invalidateEntity(entityType) {
    const config = this.cacheConfig[entityType];
    if (!config) return false;

    logger.info(`Invalidating cache for ${entityType}`, {
      pattern: config.pattern,
    });

    return this.deletePattern(config.pattern);
  }

  /**
   * Get cached data for entity
   */
  async getEntity(entityType, id) {
    const key = `${entityType}:${id}`;
    return this.get(key);
  }

  /**
   * Set cached data for entity
   */
  async setEntity(entityType, id, data) {
    const key = `${entityType}:${id}`;
    const config = this.cacheConfig[entityType];
    const ttl = config?.ttl || this.defaultTTL;

    return this.set(key, data, ttl);
  }

  /**
   * Cache query results
   */
  async cacheQuery(queryKey, queryFn, ttl = 300) {
    const cacheKey = `query:${queryKey}`;

    // Try cache
    const cached = await this.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute query
    const result = await queryFn();

    // Cache result
    await this.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Batch get multiple entities
   */
  async getBatch(entityType, ids) {
    const keys = ids.map((id) => `${entityType}:${id}`);
    const results = {};

    for (const key of keys) {
      results[key] = await this.get(key);
    }

    return results;
  }

  /**
   * Batch set multiple entities
   */
  async setBatch(entityType, entities) {
    const config = this.cacheConfig[entityType];
    const ttl = config?.ttl || this.defaultTTL;

    const promises = Object.entries(entities).map(([id, data]) =>
      this.set(`${entityType}:${id}`, data, ttl)
    );

    const results = await Promise.allSettled(promises);
    return results.filter((r) => r.status === "fulfilled").length;
  }

  /**
   * Increment counter
   */
  async increment(key, increment = 1) {
    if (!this.isConnected()) return 0;

    try {
      return await this.client.incrBy(key, increment);
    } catch (error) {
      this.handleError(error);
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key, decrement = 1) {
    if (!this.isConnected()) return 0;

    try {
      return await this.client.decrBy(key, decrement);
    } catch (error) {
      this.handleError(error);
      return 0;
    }
  }

  /**
   * Set key with expiration
   */
  async setWithExpiry(key, value, seconds) {
    if (!this.isConnected()) return false;

    try {
      await this.client.setEx(key, seconds, JSON.stringify(value));
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  /**
   * Add to set
   */
  async addToSet(key, ...members) {
    if (!this.isConnected()) return false;

    try {
      await this.client.sAdd(key, ...members);
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  /**
   * Check if member in set
   */
  async isMember(key, member) {
    if (!this.isConnected()) return false;

    try {
      return await this.client.sIsMember(key, member);
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  /**
   * Get all members of set
   */
  async getSetMembers(key) {
    if (!this.isConnected()) return [];

    try {
      return await this.client.sMembers(key);
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  /**
   * Clear entire cache
   */
  async flushAll() {
    if (!this.isConnected()) return false;

    try {
      await this.client.flushAll();
      logger.info("Redis cache flushed");
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      total,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.client;
  }

  /**
   * Handle Redis errors
   */
  handleError(error) {
    this.stats.errors++;
    logger.error("Redis error", {
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Middleware for caching GET requests
 */
function cacheMiddleware(ttl = 300) {
  return async (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const cache = getCache();
    const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;

    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.set("X-Cache", "HIT");
        return res.json(cached);
      }
    } catch (error) {
      logger.debug("Cache retrieval failed, proceeding", { error: error.message });
    }

    // Capture response
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      res.set("X-Cache", "MISS");
      cache.set(cacheKey, data, ttl).catch((error) => {
        logger.debug("Cache set failed", { error: error.message });
      });
      return originalJson(data);
    };

    next();
  };
}

/**
 * Singleton instance
 */
let cacheInstance = null;

/**
 * Get cache instance
 */
function getCache() {
  if (!cacheInstance) {
    cacheInstance = new RedisCache();
  }
  return cacheInstance;
}

module.exports = {
  RedisCache,
  getCache,
  cacheMiddleware,
};
