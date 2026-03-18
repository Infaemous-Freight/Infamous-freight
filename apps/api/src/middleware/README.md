# Middleware Guide

This directory contains middleware components for the Infæmous Freight API. This guide helps developers understand which middleware to use and when.

## Current Status

⚠️ **Action Required**: This middleware directory contains duplicate and potentially overlapping implementations that should be consolidated.

**Total Files:** 35 middleware files
**Identified Duplicates:** Multiple files appear to serve similar purposes

## Middleware Consolidation Plan

### Error Handling (3 files - CONSOLIDATE)

**Files:**
- `error-handler.ts` - TypeScript error handler
- `errorHandler.js` - JavaScript error handler
- `errorTracking.js` - Extended error tracking with monitoring

**Recommendation:**
- **Use:** `errorTracking.js` (most comprehensive with Sentry integration)
- **Archive:** `error-handler.ts`, `errorHandler.js`
- **Action:** Update all imports to use `errorTracking.js`

### Cache Implementations (4 files - CONSOLIDATE)

**Files:**
- `cache.js` - Basic in-memory cache
- `advancedCache.js` - Advanced caching with multiple strategies
- `responseCache.js` - HTTP response caching
- `smartCache.js` - Intelligent caching with Redis

**Recommendation:**
- **Use:** `smartCache.js` for Redis-backed caching
- **Use:** `responseCache.js` for HTTP response caching specifically
- **Archive:** `cache.js`, `advancedCache.js`
- **Decision Matrix:**
  - Need Redis persistence? → `smartCache.js`
  - HTTP responses only? → `responseCache.js`
  - Simple use case? → Use `smartCache.js` anyway for consistency

### RBAC/Authorization (2 files - CONSOLIDATE)

**Files:**
- `authRBAC.js` - Role-based access control
- `rbac.js` - Alternative RBAC implementation

**Recommendation:**
- **TODO:** Audit which file is used in `app.ts`/routes
- **Action:** Keep the actively used implementation
- **Archive:** The unused implementation

### Security Implementations (4 files - REVIEW)

**Files:**
- `security.js` - Core security middleware
- `advancedSecurity.js` - Extended security features
- `securityEnhanced.js` - Enhanced security layer
- `securityHardening.js` - Hardening features

**Recommendation:**
- **TODO:** Analyze differences and consolidate into 1-2 files max
- **Likely pattern:** Core security + optional hardening layer
- **Action:** Document which to use for different scenarios

## Active Middleware Guide

### Authentication & Authorization

| Middleware | Purpose | When to Use |
|------------|---------|-------------|
| `authGuards.js` | Protect routes requiring authentication | All authenticated endpoints |
| `authRBAC.js` or `rbac.js` | Role-based access control | Routes with permission requirements |
| `planEnforcement.js` | Subscription plan enforcement | Premium feature endpoints |
| `tokenRotation.js` | JWT token rotation | Security-sensitive operations |
| `keyRotation.js` | API key rotation | External API integrations |

### Security

| Middleware | Purpose | When to Use |
|------------|---------|-------------|
| `securityHeaders.js` | Set security headers (CSP, HSTS, etc.) | All routes (global) |
| `securityHardening.js` | Additional hardening measures | Production deployments |
| `cors.js` | CORS configuration | API endpoints accessed from web |
| `tenantRls.js` | Row-level security for multi-tenancy | Database queries |

### Rate Limiting

| Middleware | Purpose | When to Use |
|------------|---------|-------------|
| `rateLimit.ts` | Basic rate limiting | General API protection |
| `rateLimitRedis.js` | Redis-backed distributed rate limiting | Production/multi-instance |

### Caching

| Middleware | Purpose | When to Use |
|------------|---------|-------------|
| `smartCache.js` | Redis-backed intelligent caching | Expensive operations |
| `responseCache.js` | HTTP response caching | Read-heavy endpoints |

### Logging & Monitoring

| Middleware | Purpose | When to Use |
|------------|---------|-------------|
| `logger.js` | Request/response logging | All routes (global) |
| `auditLogging.js` | Audit trail for compliance | Sensitive operations |
| `bodyLogging.js` | Log request/response bodies | Debug mode only |
| `metricsRecorder.js` | Record performance metrics | Performance monitoring |
| `queryMonitoring.js` | Database query monitoring | Database performance tracking |
| `correlationId.js` | Distributed tracing | Multi-service architecture |
| `request-id.ts` | Request ID generation | Request tracking |

### Request Processing

| Middleware | Purpose | When to Use |
|------------|---------|-------------|
| `validation.js` | Request validation | Input validation requirements |
| `apiVersioning.js` | API version management | Versioned API endpoints |
| `idempotency.js` | Prevent duplicate operations | Payment/mutation endpoints |
| `optimization.js` | Request optimization | Performance-critical routes |
| `performance.js` | Performance monitoring | All routes (global) |

### Error Handling

| Middleware | Purpose | When to Use |
|------------|---------|-------------|
| `errorTracking.js` | Error tracking with Sentry | All routes (global, last) |

## Standard Middleware Stack

### Recommended Order (from app.js/app.ts):

```javascript
// 1. Infrastructure
app.use(correlationId());
app.use(requestId());

// 2. Security (early)
app.use(securityHeaders());
app.use(cors());

// 3. Logging (before processing)
app.use(logger());
app.use(metricsRecorder());

// 4. Request Processing
app.use(apiVersioning());
app.use(validation());

// 5. Authentication (route-specific)
// Applied per-route via authGuards()

// 6. Authorization (route-specific)
// Applied per-route via rbac() or authRBAC()

// 7. Rate Limiting (route-specific or global)
app.use(rateLimitRedis());

// 8. Business Logic
// Your route handlers

// 9. Error Handling (last)
app.use(errorTracking());
```

## Configuration Examples

### Rate Limiting

```javascript
import { rateLimitRedis } from './middleware/rateLimitRedis.js';

app.post('/api/login',
  rateLimitRedis({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    keyGenerator: (req) => req.ip
  }),
  loginHandler
);
```

### Caching

```javascript
import { smartCache } from './middleware/smartCache.js';

app.get('/api/expensive-data',
  smartCache({
    ttl: 300, // 5 minutes
    key: (req) => `data:${req.params.id}`
  }),
  dataHandler
);
```

### RBAC

```javascript
import { authGuards } from './middleware/authGuards.js';
import { rbac } from './middleware/rbac.js';

app.delete('/api/users/:id',
  authGuards.requireAuth(),
  rbac(['admin', 'user:delete']),
  deleteUserHandler
);
```

## Action Items

**HIGH PRIORITY:**
1. [ ] Determine which error handler is actively used
2. [ ] Consolidate error handlers → keep `errorTracking.js`
3. [ ] Determine which RBAC implementation is used
4. [ ] Consolidate cache implementations
5. [ ] Archive unused middleware to `docs/archived-middleware/`

**MEDIUM PRIORITY:**
1. [ ] Analyze security middleware overlap
2. [ ] Document configuration for each middleware
3. [ ] Create tests for critical middleware
4. [ ] Add JSDoc comments to all middleware exports

**LOW PRIORITY:**
1. [ ] Migrate `.js` middleware to `.ts` for type safety
2. [ ] Create integration tests for middleware chains
3. [ ] Performance benchmarks for caching middleware

## Best Practices

### When Creating New Middleware

1. **Check if it exists first** - Review this directory before creating new middleware
2. **Single Responsibility** - Each middleware should do one thing well
3. **Composable** - Middleware should work together without conflicts
4. **Documented** - Add JSDoc comments and examples
5. **Tested** - Include unit tests for middleware logic
6. **Type-safe** - Use TypeScript when possible

### Import Pattern

```typescript
// ✅ Good - Named import with clear path
import { errorTracking } from '../middleware/errorTracking.js';

// ❌ Bad - Default import with unclear naming
import middleware from '../middleware/index.js';
```

### Environment Configuration

Use centralized environment config:

```typescript
// ✅ Good
import { env } from '../config/env.js';
const redisUrl = env.redisUrl;

// ❌ Bad
const redisUrl = process.env.REDIS_URL;
```

## Questions or Issues?

If you're unsure which middleware to use:
1. Check this guide first
2. Search for usage in `apps/api/src/app.ts` or `apps/api/src/app.js`
3. Review the middleware file's comments and exports
4. Ask in the team's communication channel

---

**Last Updated:** March 16, 2026
**Maintainer:** Development Team
**Status:** Active consolidation in progress
