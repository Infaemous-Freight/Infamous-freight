// API caching utilities
export interface CacheOptions {
  ttl: number; // Time to live in seconds
  key: string;
}

class SimpleCache {
  private cache: Map<string, { data: unknown; expires: number }> = new Map();

  set(key: string, data: unknown, ttlSeconds: number): void {
    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expires });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// Run cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => cache.cleanup(), 5 * 60 * 1000);
}

// Higher-order function for caching API calls
export function withCache<T>(fn: () => Promise<T>, options: CacheOptions): () => Promise<T> {
  return async () => {
    const cached = cache.get<T>(options.key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    cache.set(options.key, result, options.ttl);
    return result;
  };
}

// HTTP cache headers helper
export function getCacheHeaders(
  maxAge: number,
  staleWhileRevalidate?: number,
): Record<string, string> {
  const cacheControl = [`s-maxage=${maxAge}`];

  if (staleWhileRevalidate) {
    cacheControl.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  return {
    "Cache-Control": cacheControl.join(", "),
  };
}

// Immutable asset cache headers
export const IMMUTABLE_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
};

// No cache headers
export const NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};
