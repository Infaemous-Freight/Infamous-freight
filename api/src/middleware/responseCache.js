/**
 * Simple response caching middleware with TTL support.
 * Cache key includes path + query string + user ID to avoid cross-tenant leakage.
 */

const cacheStore = new Map();

const CACHE_TTL_DEFAULT = 5 * 60 * 1000; // 5 minutes

function getCacheKey(req) {
    const path = req.originalUrl || req.url;
    const userId = req.user?.sub || 'anonymous';
    const orgId = req.auth?.organizationId || 'no-org';
    return `${orgId}:${userId}:${path}`;
}

function cacheResponseMiddleware(req, res, next) {
    const originalJson = res.json.bind(res);
    const cacheKey = getCacheKey(req);

    // Check cache
    const cached = cacheStore.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
        res.set('X-Cache-Hit', 'true');
        return res.json(cached.data);
    }

    // Override json to intercept and cache responses
    res.json = function (data) {
        // Only cache successful GET/HEAD responses
        if ((req.method === 'GET' || req.method === 'HEAD') && res.statusCode < 400) {
            cacheStore.set(cacheKey, {
                data,
                expiry: Date.now() + CACHE_TTL_DEFAULT,
            });

            // Cleanup old entries if cache grows too large (keep last 1000)
            if (cacheStore.size > 1000) {
                const firstKey = cacheStore.keys().next().value;
                cacheStore.delete(firstKey);
            }
        }

        return originalJson(data);
    };

    next();
}

function invalidateCacheForUser(userId, orgId) {
    for (const key of cacheStore.keys()) {
        if (key.startsWith(`${orgId}:${userId}:`)) {
            cacheStore.delete(key);
        }
    }
}

function invalidateCacheForOrg(orgId) {
    for (const key of cacheStore.keys()) {
        if (key.startsWith(`${orgId}:`)) {
            cacheStore.delete(key);
        }
    }
}

function clearAllCache() {
    cacheStore.clear();
}

module.exports = {
    cacheResponseMiddleware,
    invalidateCacheForUser,
    invalidateCacheForOrg,
    clearAllCache,
    getCacheKey,
};
