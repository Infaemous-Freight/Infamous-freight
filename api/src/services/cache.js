/**
 * Cache Service
 * Provides Redis caching with fallback to memory cache
 */

const { logger } = require('../middleware/logger');

class CacheService {
  constructor() {
    this.cache = new Map();
    this.redisClient = null;
    this.stats = {
      hits: 0,
      misses: 0,
      type: "memory",
    };
  }

  /**
   * Get stats
   */
  async getStats() {
    if (this.redisClient) {
      try {
        const info = await this.redisClient.info();
        return {
          ...this.stats,
          type: 'redis',
          connected: this.redisClient.status === 'ready',
          info: info,
        };
      } catch (err) {
        logger.warn('Failed to get Redis stats', { error: err.message });
      }
    }
    return this.stats;
  }

  /**
   * Initialize Redis (if available)
   */
  async initializeRedis() {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING;

    if (!redisUrl) {
      logger.info('No REDIS_URL configured, using memory cache');
      return true;
    }

    try {
      // Dynamically import ioredis (will fail gracefully if not installed)
      const Redis = require('ioredis');

      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError(err) {
          const targetErrors = ['READONLY', 'ECONNREFUSED'];
          return targetErrors.some(target => err.message.includes(target));
        },
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
        this.stats.type = 'memory';
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
        this.stats.type = 'redis';
      });

      this.redisClient.on('ready', () => {
        logger.info('Redis client ready');
      });

      await this.redisClient.ping();
      logger.info('Redis cache initialized');
      return true;
    } catch (err) {
      logger.warn('Failed to initialize Redis, falling back to memory cache', {
        error: err.message,
      });
      this.redisClient = null;
      return false;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (this.redisClient && this.redisClient.status === 'ready') {
        const value = await this.redisClient.get(key);
        if (value !== null) {
          this.stats.hits++;
          return JSON.parse(value);
        }
        this.stats.misses++;
        return null;
      }
    } catch (err) {
      logger.warn('Redis get failed, falling back to memory', {
        error: err.message,
        key,
      });
    }

    // Fallback to memory cache
    if (this.cache.has(key)) {
      this.stats.hits++;
      return this.cache.get(key);
    }
    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = 3600) {
    try {
      if (this.redisClient && this.redisClient.status === 'ready') {
        const serialized = JSON.stringify(value);
        if (ttl) {
          await this.redisClient.setex(key, ttl, serialized);
        } else {
          await this.redisClient.set(key, serialized);
        }
        return true;
      }
    } catch (err) {
      logger.warn('Redis set failed, falling back to memory', {
        error: err.message,
        key,
      });
    }

    // Fallback to memory cache
    this.cache.set(key, value);
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl * 1000);
    }
    return true;
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    try {
      if (this.redisClient && this.redisClient.status === 'ready') {
        await this.redisClient.del(key);
      }
    } catch (err) {
      logger.warn('Redis del failed', { error: err.message, key });
    }
    this.cache.delete(key);
  }

  /**
   * Clear cache
   */
  async clear() {
    try {
      if (this.redisClient && this.redisClient.status === 'ready') {
        await this.redisClient.flushdb();
      }
    } catch (err) {
      logger.warn('Redis clear failed', { error: err.message });
    }
    this.cache.clear();
  }

  /**
   * Check if cache is available
   */
  isAvailable() {
    return this.redisClient?.status === 'ready' || true; // Memory cache always available
  }
}

module.exports = new CacheService();
