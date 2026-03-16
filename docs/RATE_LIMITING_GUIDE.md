# Rate Limiting Guide

**Purpose:** Comprehensive guide for implementing and configuring rate limiting in the Infæmous Freight API.

---

## Overview

Rate limiting protects the API from abuse, ensures fair resource allocation, and prevents denial-of-service attacks.

**Available Rate Limiters:**
1. Basic in-memory rate limiting (`rateLimit.ts`)
2. Redis-backed distributed rate limiting (`rateLimitRedis.js`)
3. Avatar upload rate limiting (specialized)

---

## 1. Rate Limiting Strategy

### When to Use Rate Limiting

**Always Apply:**
- Authentication endpoints (`/auth/login`, `/auth/register`)
- Password reset endpoints
- Public API endpoints
- Resource-intensive operations
- File uploads

**Optional:**
- Internal admin endpoints (if exposed)
- Webhook callbacks (from trusted sources)
- Health check endpoints (exclude from limits)

### Rate Limit Tiers

**By Plan:**
```typescript
// Free tier
const FREE_TIER = {
  windowMs: 60 * 1000,  // 1 minute
  max: 60,               // 60 requests per minute
};

// Starter tier
const STARTER_TIER = {
  windowMs: 60 * 1000,
  max: 300,              // 300 requests per minute
};

// Pro tier
const PRO_TIER = {
  windowMs: 60 * 1000,
  max: 1000,             // 1000 requests per minute
};

// Enterprise tier
const ENTERPRISE_TIER = {
  windowMs: 60 * 1000,
  max: 5000,             // 5000 requests per minute
};
```

---

## 2. Redis-Backed Rate Limiting (Recommended for Production)

### File Location
`apps/api/src/middleware/rateLimitRedis.js`

### Features
- ✅ Distributed rate limiting across multiple API instances
- ✅ Sliding window algorithm
- ✅ Per-user and per-IP limiting
- ✅ Custom key generators
- ✅ Redis-backed persistence

### Basic Usage

```typescript
import { rateLimitRedis } from '../middleware/rateLimitRedis.js';

// Apply to specific route
app.post('/api/auth/login',
  rateLimitRedis({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     // 5 attempts
    keyGenerator: (req) => req.ip,  // Rate limit by IP
    message: 'Too many login attempts. Please try again later.',
  }),
  loginHandler
);
```

### Advanced Configuration

```typescript
// Rate limit by user ID (for authenticated routes)
app.post('/api/invoices',
  authenticate,
  rateLimitRedis({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.auth?.userId || req.ip,
    message: {
      error: 'Rate limit exceeded',
      retryAfter: '{{resetTime}}',  // Template variable
    },
  }),
  createInvoiceHandler
);

// Rate limit by organization
app.get('/api/reports',
  authenticate,
  requireOrganization,
  rateLimitRedis({
    windowMs: 60 * 1000,
    max: 50,
    keyGenerator: (req) => `org:${req.auth?.orgId}`,
    skipSuccessfulRequests: false,
    skipFailedRequests: true,  // Don't count failed requests
  }),
  getReportsHandler
);
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `windowMs` | number | 60000 | Time window in milliseconds |
| `max` | number | 100 | Maximum requests per window |
| `keyGenerator` | function | `(req) => req.ip` | Generates rate limit key |
| `skipSuccessfulRequests` | boolean | false | Skip counting 2xx responses |
| `skipFailedRequests` | boolean | false | Skip counting 4xx/5xx responses |
| `message` | string/object | 'Too many requests' | Error message |
| `statusCode` | number | 429 | HTTP status code for rate limit |
| `headers` | boolean | true | Send rate limit headers |

---

## 3. Basic In-Memory Rate Limiting

### File Location
`apps/api/src/middleware/rateLimit.ts`

### Features
- ✅ Simple in-memory storage
- ✅ Fast and lightweight
- ✅ Good for single-instance deployments

### Usage

```typescript
import { createRateLimiter } from '../middleware/rateLimit.js';

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

app.post('/api/auth/login', loginLimiter, loginHandler);
```

### Limitations

⚠️ **Not recommended for production with multiple API instances**
- Rate limits are per-instance, not global
- Does not share state across servers
- Resets on server restart

**Use Cases:**
- Development environments
- Single-server deployments
- Testing and staging

---

## 4. Specialized Rate Limiters

### Avatar Upload Rate Limiting

Location: `apps/api/src/config/env.ts`

```typescript
// Configuration
export const env = {
  rateLimitAvatarWindowMs: 15 * 60 * 1000,  // 15 minutes
  rateLimitAvatarMax: 20,                    // 20 uploads
};
```

Usage in avatar routes:
```typescript
import { env } from '../config/env.js';
import { rateLimitRedis } from '../middleware/rateLimitRedis.js';

app.post('/api/avatars/upload',
  authenticate,
  rateLimitRedis({
    windowMs: env.rateLimitAvatarWindowMs,
    max: env.rateLimitAvatarMax,
    keyGenerator: (req) => `avatar:${req.auth?.userId}`,
  }),
  uploadAvatarHandler
);
```

---

## 5. Rate Limit Headers

### Response Headers

When rate limiting is active, these headers are sent:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1678886400
```

### Header Descriptions

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when window resets |
| `Retry-After` | Seconds until window resets (on 429) |

### Client-Side Handling

```typescript
// JavaScript client example
async function makeRequest(url) {
  const response = await fetch(url);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    return;
  }

  return response.json();
}
```

---

## 6. Common Rate Limiting Patterns

### Pattern 1: Tiered Rate Limits by Plan

```typescript
import { rateLimitRedis } from '../middleware/rateLimitRedis.js';

function getTierLimit(req) {
  const tier = req.organization?.tier || 'free';

  const limits = {
    free: 60,
    starter: 300,
    pro: 1000,
    enterprise: 5000,
  };

  return limits[tier] || 60;
}

app.get('/api/data',
  authenticate,
  requireOrganization,
  rateLimitRedis({
    windowMs: 60 * 1000,
    max: (req) => getTierLimit(req),
    keyGenerator: (req) => `org:${req.auth?.orgId}`,
  }),
  getDataHandler
);
```

### Pattern 2: Stricter Limits for Sensitive Operations

```typescript
// Authentication: Very strict
app.post('/api/auth/login',
  rateLimitRedis({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     // Only 5 attempts
    message: 'Too many login attempts',
  }),
  loginHandler
);

// Password reset: Strict
app.post('/api/auth/reset-password',
  rateLimitRedis({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 3,                     // Only 3 resets per hour
  }),
  resetPasswordHandler
);

// Regular API: Normal limits
app.get('/api/shipments',
  authenticate,
  rateLimitRedis({
    windowMs: 60 * 1000,
    max: 100,
  }),
  getShipmentsHandler
);
```

### Pattern 3: Skip Rate Limiting for Trusted IPs

```typescript
const TRUSTED_IPS = ['10.0.0.1', '192.168.1.100'];

app.use('/api', rateLimitRedis({
  windowMs: 60 * 1000,
  max: 100,
  skip: (req) => TRUSTED_IPS.includes(req.ip),
}));
```

### Pattern 4: Different Limits for Different HTTP Methods

```typescript
// Stricter limits for write operations
app.post('/api/resources',
  rateLimitRedis({
    windowMs: 60 * 1000,
    max: 50,  // 50 POST requests per minute
  }),
  createResourceHandler
);

// Relaxed limits for read operations
app.get('/api/resources',
  rateLimitRedis({
    windowMs: 60 * 1000,
    max: 500,  // 500 GET requests per minute
  }),
  getResourcesHandler
);
```

---

## 7. Environment Configuration

### Environment Variables

```bash
# Redis (required for distributed rate limiting)
REDIS_URL=redis://localhost:6379

# Avatar-specific limits
RATE_LIMIT_AVATAR_WINDOW_MS=15  # minutes
RATE_LIMIT_AVATAR_MAX=20         # max uploads

# Global API limits (if using global middleware)
RATE_LIMIT_WINDOW_MS=60000       # 1 minute
RATE_LIMIT_MAX=100               # 100 requests
```

### Loading Configuration

```typescript
import { env } from '../config/env.js';

const rateLimiter = rateLimitRedis({
  windowMs: env.rateLimitAvatarWindowMs,
  max: env.rateLimitAvatarMax,
});
```

---

## 8. Monitoring Rate Limits

### Logging Rate Limit Events

```typescript
import { logger } from '../lib/logger.js';

app.use('/api', rateLimitRedis({
  windowMs: 60 * 1000,
  max: 100,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      userId: req.auth?.userId,
      path: req.path,
      method: req.method,
    }, 'Rate limit exceeded');

    res.status(429).json({
      error: 'Too many requests',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
}));
```

### Metrics to Track

**Key Metrics:**
- Rate limit hits per endpoint
- Top rate-limited users/IPs
- Average requests per user/org
- Rate limit false positives

**Example Metrics Collection:**

```typescript
import { logger } from '../lib/logger.js';

let rateLimitMetrics = {
  totalHits: 0,
  hitsByEndpoint: {},
  hitsByUser: {},
};

app.use('/api', rateLimitRedis({
  windowMs: 60 * 1000,
  max: 100,
  handler: (req, res) => {
    rateLimitMetrics.totalHits++;
    rateLimitMetrics.hitsByEndpoint[req.path] =
      (rateLimitMetrics.hitsByEndpoint[req.path] || 0) + 1;

    logger.warn({ metrics: rateLimitMetrics }, 'Rate limit hit');
    res.status(429).json({ error: 'Too many requests' });
  },
}));

// Export metrics endpoint (admin only)
app.get('/api/admin/rate-limit-metrics',
  authenticate,
  requireAdmin,
  (req, res) => {
    res.json(rateLimitMetrics);
  }
);
```

---

## 9. Testing Rate Limits

### Manual Testing

```bash
# Test login rate limit (should fail on 6th attempt)
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
done
```

### Automated Tests

```typescript
import request from 'supertest';
import { app } from '../app.js';

describe('Rate Limiting', () => {
  it('should rate limit login attempts', async () => {
    const endpoint = '/api/auth/login';
    const payload = { email: 'test@test.com', password: 'wrong' };

    // Make 5 requests (should succeed)
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post(endpoint).send(payload);
      expect(res.status).not.toBe(429);
    }

    // 6th request should be rate limited
    const res = await request(app).post(endpoint).send(payload);
    expect(res.status).toBe(429);
    expect(res.body.error).toContain('Too many');
  });

  it('should send rate limit headers', async () => {
    const res = await request(app).get('/api/shipments');

    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });
});
```

---

## 10. Troubleshooting

### Common Issues

**Issue: Rate limits not working**
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` environment variable
- Ensure middleware is applied before route handlers

**Issue: Rate limits too strict**
- Review `max` and `windowMs` settings
- Check if `skipSuccessfulRequests` should be enabled
- Consider tiered limits by user plan

**Issue: Rate limits reset on server restart (in-memory)**
- Switch to Redis-backed rate limiting for persistence
- Use `rateLimitRedis.js` instead of `rateLimit.ts`

**Issue: Different limits across API instances**
- Ensure all instances connect to the same Redis server
- Verify `REDIS_URL` is consistent across deployments

---

## 11. Best Practices

### ✅ DO

1. **Use Redis-backed rate limiting in production**
2. **Apply stricter limits to authentication endpoints**
3. **Send informative error messages with `Retry-After` header**
4. **Monitor rate limit hits and adjust as needed**
5. **Document rate limits in API documentation**
6. **Test rate limits in staging before production**
7. **Consider different limits for different user tiers**

### ❌ DON'T

1. **Don't use in-memory rate limiting with multiple instances**
2. **Don't apply rate limiting to health check endpoints**
3. **Don't set limits too low (frustrates legitimate users)**
4. **Don't ignore rate limit monitoring metrics**
5. **Don't forget to handle rate limit errors gracefully in client code**

---

## 12. Quick Reference

### Common Rate Limit Configurations

```typescript
import { rateLimitRedis } from '../middleware/rateLimitRedis.js';

// Login (strict)
const loginLimiter = rateLimitRedis({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip,
});

// API (normal)
const apiLimiter = rateLimitRedis({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.auth?.userId || req.ip,
});

// File upload (moderate)
const uploadLimiter = rateLimitRedis({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.auth?.userId,
});

// Public API (relaxed)
const publicLimiter = rateLimitRedis({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: (req) => req.ip,
});
```

### Files to Review

- `apps/api/src/middleware/rateLimitRedis.js` - Main rate limiter
- `apps/api/src/middleware/rateLimit.ts` - In-memory rate limiter
- `apps/api/src/config/env.ts` - Rate limit configuration
- `docs/auth_rate_limit_runbook.md` - Authentication rate limits

---

## 13. Future Enhancements

**Planned Improvements:**
- [ ] Dynamic rate limits based on user behavior
- [ ] Adaptive rate limiting during traffic spikes
- [ ] Rate limit analytics dashboard
- [ ] IP whitelist/blacklist management
- [ ] Automated rate limit adjustment based on API health

---

**Last Updated:** March 16, 2026
**Maintainer:** DevOps Team
**Related Docs:**
- `auth_rate_limit_runbook.md` - Auth-specific rate limiting
- `MIDDLEWARE_100_STATUS.md` - Middleware overview
- `API_SECURITY_CHECKLIST.md` - Security best practices
