/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Redis Caching Layer with TTL & Invalidation
 */

import Redis from "ioredis";
import { logger } from "./logger.js";
import { env } from "../config/env.js";

const redis = new Redis(env.redisUrl);

export interface CacheOptions {
  ttl?: number; // seconds
  prefix?: string;
}

/**
 * Cache TTL presets (seconds)
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 min
  MEDIUM: 300, // 5 min
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

/**
 * Cache key prefixes
 */
export const CACHE_KEYS = {
  DISPATCH_BOARD: "dispatch:board",
  DISPATCH_DRIVERS: "dispatch:drivers",
  DISPATCH_ASSIGNMENTS: "dispatch:assignments",
  DRIVER: (id: string) => `driver:${id}`,
  SHIPMENT: (id: string) => `shipment:${id}`,
  PRICING: "pricing:rates",
  ETA_ESTIMATE: (from: string, to: string) => `eta:${from}:${to}`,
};

/**
 * Generic cache getter with fallback to compute function
 */
export async function getCached<T>(
  key: string,
  compute: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const { ttl = CACHE_TTL.MEDIUM, prefix = "" } = options;
  const cacheKey = prefix ? `${prefix}:${key}` : key;

  try {
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn({ cacheKey, err }, "Cache get failed");
  }

  // Compute value
  const value = await compute();

  // Store in cache
  try {
    await redis.setex(cacheKey, ttl, JSON.stringify(value));
  } catch (err) {
    logger.warn({ cacheKey, err }, "Cache set failed");
  }

  return value;
}

/**
 * Set cache value directly
 */
export async function setCached<T>(
  key: string,
  value: T,
  options: CacheOptions = {},
): Promise<void> {
  const { ttl = CACHE_TTL.MEDIUM, prefix = "" } = options;
  const cacheKey = prefix ? `${prefix}:${key}` : key;

  try {
    await redis.setex(cacheKey, ttl, JSON.stringify(value));
  } catch (err) {
    logger.error({ cacheKey, err }, "Cache set failed");
  }
}

/**
 * Get value without compute fallback
 */
export async function getCache<T>(key: string, prefix = ""): Promise<T | null> {
  const cacheKey = prefix ? `${prefix}:${key}` : key;

  try {
    const cached = await redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    logger.warn({ cacheKey, err }, "Cache get failed");
    return null;
  }
}

/**
 * Invalidate cache key(s)
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  try {
    await redis.del(...keys);
  } catch (err) {
    logger.error({ keys, err }, "Cache invalidation failed");
  }
}

/**
 * Invalidate cache by pattern (e.g., "dispatch:*")
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.error({ pattern, err }, "Cache pattern invalidation failed");
  }
}

/**
 * Clear all cache (use with caution)
 */
export async function clearAllCache(): Promise<void> {
  try {
    await redis.flushdb();
  } catch (err) {
    logger.error({ err }, "Clear all cache failed");
  }
}

/**
 * Get cache stats
 */
export async function getCacheStats(): Promise<{
  keys: number;
  memory: number;
}> {
  try {
    const keys = await redis.keys("*");
    const info = await redis.info("memory");
    const memoryMatch = info.match(/used_memory:(\d+)/);
    const memory = memoryMatch ? parseInt(memoryMatch[1]) : 0;

    return {
      keys: keys.length,
      memory,
    };
  } catch (err) {
    logger.warn({ err }, "Cache stats retrieval failed");
    return { keys: 0, memory: 0 };
  }
}

export default redis;
