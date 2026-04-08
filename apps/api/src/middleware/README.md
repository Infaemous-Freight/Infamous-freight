# Middleware Guide

This directory contains middleware components for the Infæmous Freight API. This
guide helps developers understand which middleware to use and when.

## Consolidation Status: COMPLETE ✅

This middleware directory has been audited and consolidated to eliminate
duplication.

**Total Files:** 47 middleware files **Status:** Active middleware identified;
legacy files marked for archival

---

## ACTIVE Middleware (Currently Used)

### Error Handling

**File:** `error-handler.ts` **Status:** ✅ PRIMARY (Used in app.ts)
**Features:**

- Zod validation error handling
- ApiError with proper status codes
- Sentry integration for 5xx errors
- Structured logging with correlation IDs

**Usage:**

```typescript
import { errorHandler, notFound } from "./middleware/error-handler.js";
app.use(notFound);
app.use(errorHandler);
```

**Legacy Files (DEPRECATED):**

- `errorHandler.js` - Legacy JS version, replaced by error-handler.ts
- `errorTracking.js` - Extended version, features merged into error-handler.ts

### Authentication & Authorization

**Files:**

- `auth.ts` - Main authentication middleware
- `security.js` - Shared security utilities (authenticate, requireScope)
- `rbac.ts` - Role-based access control (currently active)
- `authGuards.js` - Route guards

**Status:** ✅ PRIMARY **Active Pattern:**

```typescript
import { authenticate } from "../middleware/security.js";
import { requireRole } from "../middleware/rbac.js";
```

**Legacy Files:**

- `rbac.js` - Legacy version, replaced by rbac.ts
- `authRBAC.js` - Alternate implementation, superseded by rbac.ts

### Rate Limiting

**File:** `rateLimit.ts` **Status:** ✅ PRIMARY (imports from security.js)
**Distributed Rate Limiting:** `rateLimitRedis.js` (for multi-instance
deployments)

### Validation

**File:** `validation.ts` (TypeScript version primary) **Status:** ✅ PRIMARY
**Fallback:** `validation.js` for legacy CommonJS code

**Exports:**

- `validate()` - Schema validation
- `handleValidationErrors` - Error handling middleware

### Logging

**File:** `logger.js` **Status:** ✅ PRIMARY **Re-exports from**
`../lib/logger.js`

---

## LEGACY Middleware (Deprecated - Do Not Use)

These files have been consolidated into the active middleware above.

### Error Handling (Consolidated → error-handler.ts)

- ❌ `errorHandler.js`
- ❌ `errorTracking.js`

### RBAC (Consolidated → rbac.ts)

- ❌ `rbac.js`
- ❌ `authRBAC.js`

### Caching (Consolidated → Use smartCache.js or responseCache.js)

- ❌ `cache.js` - Basic in-memory (replaced by smartCache.js for Redis)
- ❌ `advancedCache.js` - Overlaps with smartCache.js
- ⚠️ `smartCache.js` - Redis-backed, use for expensive operations
- ⚠️ `responseCache.js` - HTTP response caching, use for read-heavy endpoints

### Security (Consolidation in progress)

- ✅ `security.js` - Primary (authenticate, requireScope)
- ⚠️ `securityHeaders.js` - Recommended for HSTS/CSP headers
- ❓ `advancedSecurity.js` - Review if needed
- ❓ `securityEnhanced.js` - Review if needed
- ❓ `securityHardening.js` - Review if needed

### Other Middleware

| File                 | Status | Purpose                  | Alternative                            |
| -------------------- | ------ | ------------------------ | -------------------------------------- |
| `apiVersioning.js`   | ✅     | API version handling     | None (keep)                            |
| `auditLogging.js`    | ✅     | Request auditing         | Standard use                           |
| `bodyLogging.js`     | ✅     | Body logging             | Optional                               |
| `correlationId.js`   | ⚠️     | Correlation tracking     | request-id.ts (TypeScript version)     |
| `cors.js`            | ✅     | CORS configuration       | Used in app.ts                         |
| `gdprEnforcement.js` | ✅     | GDPR data handling       | Standard use                           |
| `i18n.js`            | ⚠️     | Internationalization     | Review if needed                       |
| `idempotency.js`     | ✅     | Idempotent requests      | Standard use                           |
| `keyRotation.js`     | ✅     | API key rotation         | Standard use                           |
| `metricsRecorder.js` | ✅     | Metrics collection       | Standard use                           |
| `optimization.js`    | ✅     | Performance optimization | Review context                         |
| `performance.js`     | ✅     | Performance monitoring   | Standard use                           |
| `planEnforcement.js` | ✅     | Subscription plans       | Standard use                           |
| `queryMonitoring.js` | ✅     | Query monitoring         | Standard use                           |
| `security.cjs`       | ❌     | CommonJS wrapper         | Use security.js                        |
| `security.d.ts`      | ⚠️     | Type definitions         | Part of security.js                    |
| `security.js`        | ✅     | Core security            | PRIMARY                                |
| `security.ts`        | ⚠️     | TypeScript version       | May eventually replace security.js     |
| `tenant.ts`          | ✅     | Multi-tenancy            | Standard use                           |
| `tenantRls.js`       | ✅     | Row-level security       | Tenant isolation                       |
| `tokenRotation.js`   | ✅     | Token rotation           | Security-sensitive ops                 |
| `validation.cjs`     | ❌     | CommonJS wrapper         | Use validation.js/ts                   |
| `validation.d.ts`    | ⚠️     | Type definitions         | Part of validation.ts                  |
| `validation.js`      | ✅     | Validation middleware    | CommonJS fallback                      |
| `validation.ts`      | ✅     | Validation - TypeScript  | PRIMARY (app.ts context)               |
| `redisCache.js`      | ✅     | Redis caching            | When cache needed                      |
| `request-id.ts`      | ✅     | Request ID middleware    | Modern alternative to correlationId.js |

---

## Consolidation Recommendations

### 1. Correlate ID Tracking

**Decision:** Use `request-id.ts` (app.ts imports from lib/logger.js)
**Remove:** `correlationId.js` (legacy)

### 2. Cache Strategy

- **Redis-backed:** `smartCache.js` (expensive operations)
- **HTTP Response Cache:** `responseCache.js` (read endpoints)
- **Remove:** `cache.js`, `advancedCache.js`

### 3. Security Headers

`securityHeaders.js` should be reviewed for use with CSP policies.

### 4. TypeScript Migration

As codebase progresses, migrate from `.js` to `.ts` versions:

- `security.ts` (when stabilized, replace security.js)
- `validation.ts` (already primary with app.ts)
- Continue with other modules

---

## Import Pattern Reference

### TypeScript (Modern)

```typescript
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { authenticate, requireScope } from "../middleware/security.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validation.js";
```

### CommonJS (Legacy)

```javascript
const { authenticate, requireScope } = require("../middleware/security");
const { handleValidationErrors } = require("../middleware/validation");
```

**Rule:** Always use `error-handler.ts` (TS entry) for error handling in new
code.

### Logging & Monitoring

| Middleware           | Purpose                     | When to Use                   |
| -------------------- | --------------------------- | ----------------------------- |
| `logger.js`          | Request/response logging    | All routes (global)           |
| `auditLogging.js`    | Audit trail for compliance  | Sensitive operations          |
| `bodyLogging.js`     | Log request/response bodies | Debug mode only               |
| `metricsRecorder.js` | Record performance metrics  | Performance monitoring        |
| `queryMonitoring.js` | Database query monitoring   | Database performance tracking |
| `correlationId.js`   | Distributed tracing         | Multi-service architecture    |
| `request-id.ts`      | Request ID generation       | Request tracking              |

### Request Processing

| Middleware         | Purpose                      | When to Use                   |
| ------------------ | ---------------------------- | ----------------------------- |
| `validation.js`    | Request validation           | Input validation requirements |
| `apiVersioning.js` | API version management       | Versioned API endpoints       |
| `idempotency.js`   | Prevent duplicate operations | Payment/mutation endpoints    |
| `optimization.js`  | Request optimization         | Performance-critical routes   |
| `performance.js`   | Performance monitoring       | All routes (global)           |

### Error Handling

| Middleware         | Purpose                    | When to Use               |
| ------------------ | -------------------------- | ------------------------- |
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
import { rateLimitRedis } from "./middleware/rateLimitRedis.js";

app.post(
  "/api/login",
  rateLimitRedis({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    keyGenerator: (req) => req.ip,
  }),
  loginHandler,
);
```

### Caching

```javascript
import { smartCache } from "./middleware/smartCache.js";

app.get(
  "/api/expensive-data",
  smartCache({
    ttl: 300, // 5 minutes
    key: (req) => `data:${req.params.id}`,
  }),
  dataHandler,
);
```

### RBAC

```javascript
import { authGuards } from "./middleware/authGuards.js";
import { rbac } from "./middleware/rbac.js";

app.delete(
  "/api/users/:id",
  authGuards.requireAuth(),
  rbac(["admin", "user:delete"]),
  deleteUserHandler,
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

1. **Check if it exists first** - Review this directory before creating new
   middleware
2. **Single Responsibility** - Each middleware should do one thing well
3. **Composable** - Middleware should work together without conflicts
4. **Documented** - Add JSDoc comments and examples
5. **Tested** - Include unit tests for middleware logic
6. **Type-safe** - Use TypeScript when possible

### Import Pattern

```typescript
// ✅ Good - Named import with clear path
import { errorTracking } from "../middleware/errorTracking.js";

// ❌ Bad - Default import with unclear naming
import middleware from "../middleware/index.js";
```

### Environment Configuration

Use centralized environment config:

```typescript
// ✅ Good
import { env } from "../config/env.js";
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

**Last Updated:** March 16, 2026 **Maintainer:** Development Team **Status:**
Active consolidation in progress
