/*
 * Idempotency Middleware
 * Ensures safe retries for write operations by caching responses keyed by
 * an Idempotency-Key header plus request fingerprint.
 */

const crypto = require("crypto");
const { cacheGetJson, cacheSetJson } = require("../lib/redisCache");

const useMemoryCache = process.env.NODE_ENV === "test";
const memoryCache = new Map();

async function getCachedValue(key) {
  if (useMemoryCache) {
    return memoryCache.get(key) || null;
  }
  return cacheGetJson(key);
}

async function setCachedValue(key, payload, ttlSeconds) {
  if (useMemoryCache) {
    memoryCache.set(key, payload);
    if (ttlSeconds && Number.isFinite(ttlSeconds)) {
      setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000).unref?.();
    }
    return true;
  }
  return cacheSetJson(key, payload, ttlSeconds);
}

function withIdempotency(opts = {}) {
  const scope = String(opts.scope || "default");
  const ttlSeconds = Number.isFinite(opts.ttlSeconds)
    ? opts.ttlSeconds
    : parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || "900", 10);

  return async function (req, res, next) {
    try {
      const headerKey = req.headers["idempotency-key"] || req.headers["x-idempotency-key"];
      const key = typeof headerKey === "string" ? headerKey.trim() : null;
      if (!key) return next();

      const bodyHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(req.body || {}))
        .digest("hex");

      const user = req.user?.sub || "anon";
      const fp = `${req.method}:${req.originalUrl || req.url}:${user}:${bodyHash}`;
      const redisKey = `idemp:${scope}:${key}:${fp}`;

      // Return cached response if present
      const cached = await getCachedValue(redisKey);
      if (cached && cached.body) {
        try {
          if (cached.headers) {
            for (const [h, v] of Object.entries(cached.headers)) {
              if (typeof v !== "undefined") res.setHeader(h, v);
            }
          }
        } catch (_) {
          /* Header setting failure - continue gracefully */
        }
        res.status(cached.status || 200).json(cached.body);
        return;
      }

      // Lightweight lock to avoid duplicate work when multiple requests race
      const lockKey = `${redisKey}:lock`;
      let gotLock = false;
      if (!useMemoryCache) {
        try {
          const { redisConnection } = require("../queue/redis");
          const c = redisConnection();
          const setRes = await c.set(lockKey, "1", "NX", "EX", Math.max(ttlSeconds, 60));
          gotLock = setRes === "OK";
        } catch (_) {
          /* Lock acquisition failure - continue without locking */
        }
      }

      // Wrap response methods to capture output once
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        try {
          const payload = {
            status: res.statusCode || 200,
            body: data,
            headers: {
              "Content-Type": res.getHeader("Content-Type") || "application/json",
            },
          };
          await setCachedValue(redisKey, payload, ttlSeconds);
        } catch (_) {
          /* Cache write failure - continue without caching */
        }
        if (!useMemoryCache) {
          try {
            // Release lock
            const { redisConnection } = require("../queue/redis");
            const c = redisConnection();
            await c.del(lockKey);
          } catch (_) {
            /* Lock release failure - will expire automatically */
          }
        }
        return originalJson(data);
      };

      next();
    } catch (e) {
      next();
    }
  };
}

module.exports = { withIdempotency };
