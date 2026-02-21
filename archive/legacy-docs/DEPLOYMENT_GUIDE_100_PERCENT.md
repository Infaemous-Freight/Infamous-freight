# 100% Implementation Deployment Guide

## Overview

This document covers deployment of all security, performance, and observability
features implemented (100%).

## Quick Start

```bash
# 1. Verify implementation
bash scripts/verify-implementation.sh

# 2. Install dependencies
pnpm install

# 3. Build shared package
pnpm --filter @infamous-freight/shared build

# 4. Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# 5. Run tests
pnpm --filter api test
pnpm --filter api test -- security-performance.integration.test.js

# 6. Start development
pnpm dev

# 7. Verify metrics endpoint
curl http://localhost:4000/api/metrics
```

## Environment Variables Required

```bash
# Authentication
AUTH_SECRET=your-random-secret-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/infamous_freight

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Performance
SLOW_QUERY_THRESHOLD_MS=1000

# Monitoring (optional)
SENTRY_DSN=https://key@sentry.io/project-id
LOG_LEVEL=info
```

## Features Implemented (100%)

### 🔐 Security

- ✅ Organization boundary enforcement (`requireOrganization`)
- ✅ Scope-based access control (`requireScope`)
- ✅ JWT authentication with org_id claim
- ✅ Helmet CSP headers with strict defaults
- ✅ CORS origin allow-list
- ✅ Correlation ID propagation
- ✅ Rate limiting (general, auth, ai, billing, voice, export, webhook)
- ✅ OPTIONS preflight exemption from rate limiting

### ✅ Validation

- ✅ Enum validation (SHIPMENT_STATUSES)
- ✅ UUID validation (path & body)
- ✅ Pagination query validation
- ✅ Consistent error responses

### 📊 Observability

- ✅ Prometheus metrics endpoint (`/api/metrics`)
- ✅ Request duration histograms (buckets: 10, 50, 100, 250, 500, 1000, 2500,
  5000ms)
- ✅ Latency percentiles (P50, P95, P99)
- ✅ Request/error counts by path
- ✅ Rate limiter metrics (hits, blocked, success)
- ✅ Slow query logging (Prisma $on event)
- ✅ Response caching with org/user isolation
- ✅ Sentry integration

### 🚀 DevOps

- ✅ Pre-push hook (linting, type-check, build, tests)
- ✅ Pre-dev hook (shared package build check)
- ✅ Route scope registry documentation
- ✅ CORS & Security guide
- ✅ Route scope registry documentation

### 🧪 Tests

- ✅ Shipments auth/org/scope tests
- ✅ Billing auth/org/scope tests
- ✅ Metrics Prometheus format tests
- ✅ Slow query logger tests
- ✅ Response cache tests
- ✅ Comprehensive security/performance integration tests

## Verification Checklist

```bash
# 1. Verify all files exist and export correctly
bash scripts/verify-implementation.sh

# Expected output:
# ✅ All core files present
# ✅ All exports available
# ✅ Middleware wired in server
# ✅ Environment variables documented

# 2. Run full test suite
pnpm --filter api test

# Expected:
# PASS apps/api/src/__tests__/integration/shipments.auth.test.js
# PASS apps/api/src/__tests__/integration/billing.auth.test.js
# PASS apps/api/src/__tests__/integration/metrics.prometheus.test.js
# PASS apps/api/src/__tests__/integration/slowQueryLogger.test.js
# PASS apps/api/src/__tests__/integration/responseCache.test.js
# PASS apps/api/src/__tests__/integration/security-performance.integration.test.js

# 3. Check metrics endpoint
curl -s http://localhost:4000/api/metrics | head -20

# Expected:
# # HELP rate_limit_hits_total Total requests seen by limiter
# # TYPE rate_limit_hits_total counter
# # HELP http_request_duration_ms HTTP request duration in milliseconds
# # TYPE http_request_duration_ms histogram
# rate_limit_hits_total{name="general"} 0
```

## Production Checklist

- [ ] `AUTH_SECRET` set to strong random value
- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] `CORS_ORIGINS` set to production domains only
- [ ] `SENTRY_DSN` configured for error tracking
- [ ] `NODE_ENV=production`
- [ ] Database migrations applied
- [ ] Husky pre-push hooks installed (`npx husky install`)
- [ ] All tests passing
- [ ] Metrics endpoint accessible and returning data
- [ ] HTTPS enforced in production
- [ ] CSP headers configured via `CSP_REPORT_URI`

## Monitoring Setup

### Sentry

1. Create Sentry project for API
2. Set `SENTRY_DSN=https://key@sentry.io/project-id`
3. Slow query warnings auto-reported to Issues
4. Error responses auto-reported to Issues

### Prometheus

1. Point Prometheus scrape to `http://api:4000/api/metrics`
2. Create dashboard for histograms & percentiles
3. Set alerts for P95 > 1000ms, P99 > 5000ms
4. Track error rate (5xx responses)

### Datadog (Optional)

1. Set `DD_TRACE_ENABLED=true`
2. Set `DD_SERVICE=infamous-freight-api`
3. Set `DD_ENV=production`
4. View traces in Datadog APM

## Common Issues

### Q: Metrics endpoint returns empty?

A: Middleware must be wired in server.js. Check:

```bash
grep -n "cacheResponseMiddleware\|metricsRecorderMiddleware" apps/api/src/server.js
```

Should see both lines after `correlationMiddleware`.

### Q: Slow queries not logged?

A: Check Prisma initialization:

```bash
grep -n "attachSlowQueryLogger" apps/api/src/db/prisma.js
```

Should be called after `new PrismaClient()`.

### Q: Auth tests failing?

A: Ensure `requireOrganization` middleware is applied. Check routes:

```bash
grep -A5 "GET.*shipments" apps/api/src/routes/shipments.js | grep requireOrganization
```

### Q: CORS errors on cross-origin requests?

A: Verify `CORS_ORIGINS` environment variable:

```bash
echo $CORS_ORIGINS
# Should match frontend origin: http://localhost:3000
```

## Documentation

- [Route Scope Registry](docs/ROUTE_SCOPE_REGISTRY.md) – All routes & their
  required scopes
- [CORS & Security](docs/CORS_AND_SECURITY.md) – CORS configuration & best
  practices
- [Copilot Instructions](.github/copilot-instructions.md) – Development
  guidelines

## Support

For issues:

1. Check verification script output
2. Review relevant test file
3. Check Sentry Issues dashboard
4. Review logs: `tail -f logs/*.log`
