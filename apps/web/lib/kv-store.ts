/**
 * Vercel KV Store - Distributed Caching
 *
 * Fast, globally distributed Redis-compatible key-value store
 *
 * Setup:
 * 1. Install: pnpm add @vercel/kv
 * 2. Create KV store in Vercel Dashboard (Storage → KV)
 * 3. Link to project: vercel link
 * 4. Pull env vars: vercel env pull
 *
 * @see https://vercel.com/docs/storage/vercel-kv
 */

// Uncomment when @vercel/kv is installed
// import { kv } from '@vercel/kv';

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  // Short-lived cache (5 minutes)
  SHORT_TTL: 60 * 5, // 300 seconds

  // Medium cache (1 hour)
  MEDIUM_TTL: 60 * 60, // 3600 seconds

  // Long cache (24 hours)
  LONG_TTL: 60 * 60 * 24, // 86400 seconds

  // Extended cache (7 days)
  EXTENDED_TTL: 60 * 60 * 24 * 7, // 604800 seconds
};

/**
 * Cache key prefixes for organization
 */
export const CACHE_KEYS = {
  USER: "user:",
  SESSION: "session:",
  SHIPMENT: "shipment:",
  API_RESPONSE: "api:",
  FEATURE_FLAG: "flag:",
  RATE_LIMIT: "rate:",
  ANALYTICS: "analytics:",
} as const;

/**
 * In-memory fallback cache (when KV is unavailable)
 */
class MemoryCache {
  private cache = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }
}

const memoryCache = new MemoryCache();

/**
 * Get value from cache
 *
 * @param key - Cache key
 * @returns Cached value or null
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    // Uncomment when KV is set up
    // return await kv.get<T>(key);

    // Fallback to memory cache
    return await memoryCache.get<T>(key);
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
}

/**
 * Set value in cache
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttl - Time to live in seconds (default: 1 hour)
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = CACHE_CONFIG.MEDIUM_TTL,
): Promise<void> {
  try {
    // Uncomment when KV is set up
    // await kv.set(key, value, { ex: ttl });

    // Fallback to memory cache
    await memoryCache.set(key, value, ttl);
  } catch (error) {
    console.error("Cache set error:", error);
  }
}

/**
 * Delete value from cache
 *
 * @param key - Cache key
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    // Uncomment when KV is set up
    // await kv.del(key);

    // Fallback to memory cache
    await memoryCache.del(key);
  } catch (error) {
    console.error("Cache delete error:", error);
  }
}

/**
 * Check if key exists in cache
 *
 * @param key - Cache key
 * @returns Boolean indicating if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    // Uncomment when KV is set up
    // return (await kv.exists(key)) === 1;

    // Fallback to memory cache
    return await memoryCache.exists(key);
  } catch (error) {
    console.error("Cache exists error:", error);
    return false;
  }
}

/**
 * Get or set cached value (cache-aside pattern)
 *
 * @param key - Cache key
 * @param fetcher - Function to fetch value if not cached
 * @param ttl - Time to live in seconds
 * @returns Cached or fetched value
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_CONFIG.MEDIUM_TTL,
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const fresh = await fetcher();

  // Cache the result
  await cacheSet(key, fresh, ttl);

  return fresh;
}

/**
 * Increment counter in cache (for rate limiting, analytics)
 *
 * @param key - Cache key
 * @returns New counter value
 */
export async function cacheIncr(key: string): Promise<number> {
  try {
    // Uncomment when KV is set up
    // return await kv.incr(key);

    // Fallback: increment in memory cache
    const current = (await memoryCache.get<number>(key)) || 0;
    const newValue = current + 1;
    await memoryCache.set(key, newValue, CACHE_CONFIG.SHORT_TTL);
    return newValue;
  } catch (error) {
    console.error("Cache increment error:", error);
    return 0;
  }
}

/**
 * Set expiration for a key
 *
 * @param key - Cache key
 * @param seconds - Seconds until expiration
 */
export async function cacheExpire(key: string, seconds: number): Promise<void> {
  try {
    // Uncomment when KV is set up
    // await kv.expire(key, seconds);

    // Fallback: re-set with new TTL
    const value = await memoryCache.get(key);
    if (value !== null) {
      await memoryCache.set(key, value, seconds);
    }
  } catch (error) {
    console.error("Cache expire error:", error);
  }
}

/**
 * Cache user data
 *
 * @param userId - User ID
 * @param userData - User data to cache
 * @param ttl - Time to live (default: 1 hour)
 */
export async function cacheUser(
  userId: string,
  userData: unknown,
  ttl: number = CACHE_CONFIG.MEDIUM_TTL,
): Promise<void> {
  await cacheSet(`${CACHE_KEYS.USER}${userId}`, userData, ttl);
}

/**
 * Get cached user data
 *
 * @param userId - User ID
 * @returns Cached user data or null
 */
export async function getCachedUser<T>(userId: string): Promise<T | null> {
  return await cacheGet<T>(`${CACHE_KEYS.USER}${userId}`);
}

/**
 * Cache API response
 *
 * @param endpoint - API endpoint
 * @param response - Response data
 * @param ttl - Time to live (default: 5 minutes)
 */
export async function cacheAPIResponse(
  endpoint: string,
  response: unknown,
  ttl: number = CACHE_CONFIG.SHORT_TTL,
): Promise<void> {
  const key = `${CACHE_KEYS.API_RESPONSE}${endpoint}`;
  await cacheSet(key, response, ttl);
}

/**
 * Get cached API response
 *
 * @param endpoint - API endpoint
 * @returns Cached response or null
 */
export async function getCachedAPIResponse<T>(endpoint: string): Promise<T | null> {
  const key = `${CACHE_KEYS.API_RESPONSE}${endpoint}`;
  return await cacheGet<T>(key);
}

/**
 * Invalidate cache by pattern (when KV supports it)
 *
 * @param pattern - Key pattern to invalidate
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    // Uncomment when KV is set up and supports pattern matching
    // const keys = await kv.keys(pattern);
    // await Promise.all(keys.map(key => kv.del(key)));

    console.log(`Cache invalidation for pattern: ${pattern}`);
  } catch (error) {
    console.error("Cache invalidate error:", error);
  }
}

/**
 * Rate limiting check using cache
 *
 * @param identifier - User/IP identifier
 * @param limit - Max requests allowed
 * @param window - Time window in seconds
 * @returns Boolean indicating if request is allowed
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  window: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `${CACHE_KEYS.RATE_LIMIT}${identifier}`;

  try {
    const current = await cacheIncr(key);

    // Set expiration on first request
    if (current === 1) {
      await cacheExpire(key, window);
    }

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Allow request on error
    return { allowed: true, remaining: limit };
  }
}

/**
 * Cache statistics
 *
 * @returns Cache statistics object
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  type: "kv" | "memory";
}> {
  return {
    connected: true,
    type: "memory", // Change to 'kv' when Vercel KV is set up
  };
}
