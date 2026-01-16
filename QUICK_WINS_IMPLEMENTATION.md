# Quick Wins Implementation (Phase 3)

## 1) Database Query Logging
- Add Prisma middleware to log slow queries >100ms (see `DATABASE_PERFORMANCE_GUIDE.md`).
- File to add: `api/src/config/prismaExtended.js` with middleware logging duration + params.
- Expose admin endpoint: `GET /admin/database/slow-queries` (admin-only) returning last 50 slow queries.

## 2) Health Check Dashboard
- Endpoint: `GET /admin/health/full` (admin-only).
- Payload:
  - api: uptime, version, commit SHA
  - database: connectivity check via `SELECT 1` + latency
  - redis: ping + latency (if configured)
  - queues: depth per queue (if using bull/bee/kue)
  - rateLimits: remaining counts per limiter
  - external: call to dependency (e.g., payment gateway sandbox) with timeout
- Add status `ok|degraded|down` per component; overall status = worst component.

## 3) Rate Limit Analytics
- Collect limiter metrics (hits, blocked) by key (`req.user?.sub || req.ip`).
- Add in-memory counters (or Redis hash) incremented in limiter `skipFailedRequests` handlers.
- Endpoint: `GET /admin/rate-limits` (admin-only) returning per-limiter stats + top offenders.

## 4) Feature Flags Management
- Simple service: `api/src/services/featureFlags.js`
  - Sources: env defaults, in-memory overrides, optional Redis-backed overrides.
  - API:
    - `isEnabled(flag, user?)`
    - `setFlag(flag, value)` (admin-only endpoint)
    - `listFlags()`
- Endpoints:
  - `GET /admin/flags` returns flags with source.
  - `POST /admin/flags` { flag, value } updates override.
- Use flags for risky features (e.g., new AI command route, beta UI).

## 5) Known Issues Documentation
- File: `KNOWN_ISSUES.md`
  - Current limitations, workarounds, expected fixes/ETAs.
  - Include: long-running queries on large shipment exports, AI provider rate limits, voice upload size limits, missing mobile feature parity.

## 6) Logging & Monitoring Enhancements
- Ensure correlation IDs in every log; surface `X-Correlation-ID` in responses.
- Standardize log fields: timestamp, level, message, requestId, userId, path, method, status, duration, errorCode.
- Configure alerts for:
  - 5xx rate > 1% for 5m
  - Auth failures spike (login 401/403)
  - Rate-limit blocks spike
  - Slow requests p95 > 1s
- Add log sampling in high-volume endpoints to reduce cost (sample debug logs).

## Minimal Implementation Steps
- [ ] Create feature flag service + admin routes.
- [ ] Add `/admin/health/full` and `/admin/rate-limits` endpoints.
- [ ] Add Prisma slow query middleware + `/admin/database/slow-queries`.
- [ ] Add correlation ID middleware if not present.
- [ ] Document known issues in `KNOWN_ISSUES.md`.
