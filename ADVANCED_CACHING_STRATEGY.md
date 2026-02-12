# Advanced Caching Strategy Guide

## Overview

This guide implements a comprehensive Redis caching layer for the Infamous Freight Enterprises API.

## Architecture

```
Client Request
    ↓
API Endpoint
    ↓
Cache Check (Redis)
    ├→ Cache Hit → Return Cached Response
    └→ Cache Miss → Query Database
                    ↓
                    Store in Cache
                    ↓
                    Return Response
```

## Installation & Setup

### 1. Install Redis Dependencies

```bash
npm install redis ioredis cache-manager cache-manager-redis-store
npm install --save-dev @types/ioredis
```

### 2. Create Redis Service

**File: `apps/api/src/services/cacheService.js`**

```javascript
const redis = require('ioredis');
const { env } = require('../config/env');

class CacheService {
  constructor() {
    this.client = new redis({
      host: env?.redisHost || 'localhost',
      port: env?.redisPort || 6379,
      password: env?.redisPassword,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.client.on('connect', () => {
      console.info('Redis connected');
    });
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 3600)
   */
  async set(key, value, ttl = 3600) {
    try {
      const json = JSON.stringify(value);
      await this.client.setex(key, ttl, json);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete cache key
   * @param {string} key - Cache key
   */
  async delete(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys with pattern
   * @param {string} pattern - Key pattern (e.g., 'shipment:*')
   */
  async deletePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      await this.client.flushdb();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Increment counter
   * @param {string} key - Counter key
   * @param {number} increment - Amount to increment
   */
  async increment(key, increment = 1) {
    try {
      return await this.client.incrby(key, increment);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get with automatic refresh
   * @param {string} key - Cache key
   * @param {Function} fetcher - Function to fetch data if cache miss
   * @param {number} ttl - Time to live
   */
  async getOrFetch(key, fetcher, ttl = 3600) {
    const cached = await this.get(key);
    if (cached) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return fresh;
  }
}

module.exports = new CacheService();
```

### 3. Create Cache Middleware

**File: `apps/api/src/middleware/cacheMiddleware.js`**

```javascript
const cacheService = require('../services/cacheService');

/**
 * Cache GET requests
 * Usage: router.get('/endpoint', cacheMiddleware(3600), handler)
 */
function cacheMiddleware(ttl = 3600) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if user is authenticated (personal data)
    if (req.user) {
      return next();
    }

    const cacheKey = `http:${req.originalUrl}`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      console.info(`Cache hit: ${cacheKey}`);
      return res.json(cached);
    }

    // Intercept res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      cacheService.set(cacheKey, data, ttl);
      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidate cache patterns
 * Usage: await invalidateCache('shipment:*')
 */
async function invalidateCache(patterns) {
  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  for (const pattern of patternList) {
    await cacheService.deletePattern(pattern);
    console.info(`Cache invalidated: ${pattern}`);
  }
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
};
```

## Usage Examples

### Example 1: Cache Shipment Details

```javascript
// apps/api/src/routes/shipments.js
const cacheMiddleware = require('../middleware/cacheMiddleware');
const cacheService = require('../services/cacheService');

router.get('/shipments/:id', cacheMiddleware(3600), async (req, res) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: req.params.id },
  });
  res.json(shipment);
});

router.put('/shipments/:id', async (req, res, next) => {
  try {
    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: req.body,
    });

    // Invalidate cache
    await cacheService.delete(`http:/api/shipments/${req.params.id}`);
    await cacheService.deletePattern('shipment:*');

    res.json(updated);
  } catch (err) {
    next(err);
  }
});
```

### Example 2: Cache List Endpoints

```javascript
router.get('/shipments', cacheMiddleware(1800), async (req, res) => {
  const shipments = await prisma.shipment.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
  });
  res.json(shipments);
});
```

### Example 3: Cache with Custom Logic

```javascript
router.get('/reports/analytics', async (req, res) => {
  const report = await cacheService.getOrFetch(
    'report:analytics:monthly',
    async () => {
      // Heavy computation
      return await computeAnalytics();
    },
    3600 // 1 hour TTL
  );
  res.json(report);
});
```

## Configuration

### Environment Variables

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Cache TTL (in seconds)
CACHE_TTL_USERS=3600       # 1 hour
CACHE_TTL_SHIPMENTS=1800   # 30 minutes
CACHE_TTL_REPORTS=7200     # 2 hours
CACHE_TTL_ANALYTICS=86400  # 24 hours
```

## Cache Keys Convention

```
# By resource type
user:<id>
shipment:<id>
location:<id>

# By resource list
users:page:<page>
shipments:status:<status>
shipments:driver:<driverId>

# By operation
report:<type>:<period>
analytics:<section>
stats:realtime

# By HTTP endpoint
http:/api/users/123
http:/api/shipments?status=active
```

## Cache Invalidation Strategy

### Automatic Invalidation on Mutations

```javascript
async function invalidateOnUpdate(resource, id) {
  const patterns = [
    `${resource}:${id}`,           // Specific resource
    `${resource}:*`,                // All of that resource type
    `http:/api/${resource}s/${id}`,  // HTTP endpoint
  ];

  await cacheService.deletePattern(patterns);
}
```

### Cache Invalidation on Events

```javascript
// Example: Invalidate when shipment status changes
emitter.on('shipment:status-changed', async (shipmentId) => {
  await cacheService.deletePattern(`shipment:${shipmentId}:*`);
  await cacheService.deletePattern('shipments:*');
  await cacheService.deletePattern('report:*');
});
```

## Monitoring & Metrics

### Cache Hit Rate

```javascript
class CacheMetrics {
  constructor() {
    this.hits = 0;
    this.misses = 0;
  }

  hitRate() {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  }

  log() {
    console.info(`Cache Hit Rate: ${this.hitRate().toFixed(2)}%`);
  }
}
```

### Redis Stats Endpoint

```javascript
router.get('/admin/cache/stats', async (req, res) => {
  const info = await cacheService.client.info();
  const dbSize = await cacheService.client.dbsize();

  res.json({
    status: 'connected',
    keys: dbSize,
    info: parseInfo(info),
  });
});
```

## Best Practices

1. **Cache Invalidation**: Always invalidate related caches on updates
2. **TTL Strategy**: Shorter TTL for frequently changing data
3. **Cache Warming**: Pre-populate cache for critical data
4. **Monitoring**: Track cache hit rate and adjust strategy
5. **Error Handling**: Graceful degradation if Redis fails
6. **Serialization**: Use JSON.stringify/parse for consistency

## Testing

```javascript
describe('Cache Service', () => {
  beforeEach(async () => {
    await cacheService.clear();
  });

  test('should cache and retrieve value', async () => {
    await cacheService.set('test:key', { data: 'value' });
    const result = await cacheService.get('test:key');
    expect(result).toEqual({ data: 'value' });
  });

  test('should expire cached value', async () => {
    await cacheService.set('test:ttl', { data: 'value' }, 1);
    await new Promise(r => setTimeout(r, 1100));
    const result = await cacheService.get('test:ttl');
    expect(result).toBeNull();
  });
});
```

## Troubleshooting

**Issue: Redis connection fails**

- Check Redis is running: `redis-cli ping`
- Verify credentials in env variables
- Check firewall/network access

**Issue: Memory usage growing**

- Implement cache eviction policy: `maxmemory-policy allkeys-lru`
- Set reasonable TTLs
- Monitor with `MEMORY STATS`

**Issue: Stale data served**

- Reduce TTL for frequently changing data
- Implement cache versioning
- Add cache invalidation on mutations

## References

- [ioredis Documentation](https://github.com/luin/ioredis)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [Cache Invalidation Strategies](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
