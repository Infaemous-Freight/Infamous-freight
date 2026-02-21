# Observability Guide - Infamous Freight Enterprises

Comprehensive guide for monitoring, logging, tracing, and observing the Infamous
Freight system in production and development.

## Table of Contents

- [Overview](#overview)
- [Logging Strategy](#logging-strategy)
- [Error Tracking with Sentry](#error-tracking-with-sentry)
- [Application Performance Monitoring (Datadog)](#application-performance-monitoring-datadog)
- [Metrics & Dashboards](#metrics--dashboards)
- [Alerting](#alerting)
- [Health Checks](#health-checks)
- [Debugging Production Issues](#debugging-production-issues)
- [Common Scenarios](#common-scenarios)

## Overview

Infamous Freight observability stack:

```
┌─────────────────────────────────────────────────────────┐
│ Application Layer (APIs, Services)                      │
│ ├─ Winston Logging                                      │
│ ├─ Correlation IDs (request tracing)                    │
│ └─ Performance metrics                                  │
├─────────────────────────────────────────────────────────┤
│ Observability Layer                                     │
│ ├─ Sentry (Error Tracking)                             │
│ ├─ Datadog (APM, Metrics, RUM)                         │
│ ├─ Health Checks (/api/health, /api/health/detailed)   │
│ └─ Performance Monitoring (Web Vitals, API latencies)   │
├─────────────────────────────────────────────────────────┤
│ Dashboards & Alerting                                   │
│ ├─ Datadog Dashboard                                    │
│ ├─ Sentry Dashboard                                     │
│ ├─ Custom alerting rules                                │
│ └─ On-call rotations                                    │
└─────────────────────────────────────────────────────────┘
```

## Logging Strategy

### Winston Logger Configuration

API logger is configured in `apps/api/src/middleware/logger.js`:

```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    process.env.NODE_ENV === "production"
      ? new winston.transports.Stream({ stream: process.stdout })
      : new winston.transports.Console(),
  ],
});
```

### Log Levels (Priority)

| Level   | Severity     | Use Case                                                          |
| ------- | ------------ | ----------------------------------------------------------------- |
| `error` | 🔴 Critical  | Application errors, exceptions, failed operations                 |
| `warn`  | 🟠 Important | Rate limits hit, deprecated API usage, partial failures           |
| `info`  | 🔵 Normal    | Business events (user login, shipment created, payment processed) |
| `debug` | 🟢 Detailed  | Diagnostic info (only in development)                             |

### Structured Logging

Always log with structured context:

```javascript
// ✅ GOOD: Structured logging with context
logger.info("Shipment created", {
  shipmentId: shipment.id,
  userId: req.user.sub,
  organizationId: req.auth.organizationId,
  destinationCity: shipment.destination.city,
  status: shipment.status,
  durationMs: Date.now() - req.startTime,
});

// ❌ BAD: Unstructured logging
logger.info(`Shipment ${shipment.id} created by user ${req.user.sub}`);
```

### Log Aggregation

**Production**:

- Railway: Logs viewable via `railway logs --follow`
- Cloudflare: Logs accessible via Workers dashboard
- Datadog: Logs forwarded automatically

**Local Development**:

- Winston outputs to console + files
- View logs: `tail -f combined.log`

## Error Tracking with Sentry

### Configuration

Sentry initialized in `apps/api/src/instrument.js`:

```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ breadcrumbs: true }),
    new Sentry.Integrations.OnUncaughtException(),
  ],
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.01, // 1% in production
});
```

### Web App Sentry

Web app error tracking in `apps/web/pages/_app.tsx`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Error Reporting Patterns

**API Route Handler** (Express.js):

```javascript
router.post("/action", authenticate, async (req, res, next) => {
  try {
    const result = await service.doAction(req.body);
    res.json(new ApiResponse({ success: true, data: result }));
  } catch (err) {
    // Sentry context enrichment
    Sentry.captureException(err, {
      tags: {
        path: req.path,
        method: req.method,
        userId: req.user?.sub,
        organizationId: req.auth?.organizationId,
      },
      level: "error",
    });
    next(err); // Delegate to error handler
  }
});
```

**Sentry Breadcrumbs** (Diagnostic trail):

```javascript
Sentry.addBreadcrumb({
  message: "Database query",
  level: "debug",
  data: {
    query: "SELECT * FROM shipments WHERE id = ?",
    durationMs: 45,
  },
});
```

### Viewing Errors

1. Navigate to https://sentry.io
2. Select project → Issues tab
3. Filter by:
   - Status (unresolved, regression)
   - Environment (production, staging)
   - Time range
4. Click issue to view:
   - Error message + stack trace
   - Breadcrumbs (event trail)
   - User context
   - Request details

### Error Resolution

- **Mark as Resolved**: Will re-alert if occurs again
- **Ignore**: Stop tracking this error class
- **Add to Release**: Link to code fix / PR

## Application Performance Monitoring (Datadog)

### Configuration

**API** (`apps/api/src/server.js`):

```javascript
if (process.env.DD_TRACE_ENABLED === "true") {
  require("dd-trace").init({
    service: process.env.DD_SERVICE || "infamous-freight-api",
    env: process.env.DD_ENV || process.env.NODE_ENV,
    runtimeMetrics: true,
  });
}
```

**Web** (`apps/web/pages/_app.tsx`):

```typescript
if (process.env.NEXT_PUBLIC_DD_APP_ID) {
  window.DD_RUM?.init({
    applicationId: process.env.NEXT_PUBLIC_DD_APP_ID,
    clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN,
    site: process.env.NEXT_PUBLIC_DD_SITE || "datadoghq.com",
    service: "infamous-freight-web",
    env: process.env.NEXT_PUBLIC_ENV,
  });
}
```

### Traces & Spans

Datadog traces API requests down to database queries:

```
POST /api/shipments (100ms total)
├─ authenticate() (5ms)
├─ validate() (2ms)
├─ service.createShipment() (90ms)
│  ├─ prisma.shipment.create() (45ms) [database query]
│  └─ cache.set() (3ms) [cache operation]
├─ response() (1ms)
└─ error handling (1ms)
```

**Custom Spans** (for long operations):

```javascript
const span = tracer.startSpan("export_to_csv");
try {
  const csv = await exportToCSV(shipments);
  span.finish();
} catch (err) {
  span.setTag("error", true);
  span.finish();
}
```

### Metrics

**Key Metrics Tracked**:

| Metric                  | Target         | Alert   |
| ----------------------- | -------------- | ------- |
| API Response P95        | < 500ms        | > 1s    |
| API Response P99        | < 2s           | > 5s    |
| Error Rate              | < 0.1%         | > 1%    |
| Database Query Time P95 | < 100ms        | > 500ms |
| Cache Hit Rate          | > 70%          | < 50%   |
| Redis Connection Pool   | < 80% utilized | > 90%   |

**Custom Metrics**:

```javascript
// Example: Track shipment creation rate
statsd.increment("shipment.created", 1, {
  organization_id: req.auth.organizationId,
  status: shipment.status,
});

// Track expensive operations
statsd.timing("export.csv_generation", durationMs, {
  rows: shipments.length,
});
```

### Dashboards

Access Datadog at https://datadoghq.com:

1. **Service Overview**: CPU, memory, requests/sec
2. **API Endpoints**: Latency, error rate, throughput by route
3. **Database**: Query time, connection pool, slow queries
4. **Error Tracking**: Error rate by type, trend
5. **Business Metrics**: Shipments created/day, revenue, etc.

## Metrics & Dashboards

### Prometheus Metrics Endpoint

Expose metrics for scraping:

```bash
curl http://localhost:4000/api/metrics
```

**Output Format**:

```
# HELP api_requests_total Total API requests
# TYPE api_requests_total counter
api_requests_total{method="POST",route="/api/shipments",status="201"} 42

# HELP api_request_duration_ms API request duration histogram
# TYPE api_request_duration_ms histogram
api_request_duration_ms_bucket{route="/api/shipments",le="100"}  10
api_request_duration_ms_bucket{route="/api/shipments",le="500"}  35
api_request_duration_ms_bucket{route="/api/shipments",le="+Inf"} 42
```

### Custom Dashboard (Datadog)

Create a dashboard for operational visibility:

```json
{
  "title": "Infamous Freight - Prod Dashboard",
  "widgets": [
    {
      "type": "timeseries",
      "query": "avg:trace.web.request.duration{env:production}",
      "title": "API Response Time (P95)"
    },
    {
      "type": "gauge",
      "query": "sum:trace.web.requests.status{status:5xx}",
      "title": "5XX Errors / min"
    },
    {
      "type": "timeseries",
      "query": "avg:system.memory.usage{service:infamous-freight-api}",
      "title": "API Memory Usage"
    }
  ]
}
```

## Alerting

### Alert Rules

Configure alerts in Datadog for operational issues:

| Alert                   | Condition                     | Action                              |
| ----------------------- | ----------------------------- | ----------------------------------- |
| High Error Rate         | Error rate > 1% for 5 min     | Trigger incident, notify #incidents |
| Slow API                | P95 latency > 1s for 10 min   | Page on-call engineer               |
| DB Connection Pool Full | Connection utilization > 95%  | Alert + recommend restart           |
| Memory Leak             | Memory growth > 20% in 1 hour | Capture dump, create incident       |
| Certificate Expiry      | < 7 days to expiration        | Notify ops team                     |

**Setup Alert**:

1. Datadog → Monitors → New Monitor
2. Select metric (e.g., error rate)
3. Set threshold (> 1%)
4. Set duration (for 5 minutes)
5. Configure notification (Slack, PagerDuty, email)

### Notification Channels

- **Slack**: #incidents, #api-alerts
- **PagerDuty**: Incident escalation
- **SMS**: P1 severity only
- **Email**: Summary digest hourly

## Health Checks

### API Health Endpoints

**Basic Health** (`GET /api/health`):

```bash
curl http://localhost:4000/api/health

# Response (200 OK):
{
  "uptime": 86400,
  "timestamp": 1707916800000,
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

**Detailed Health** (`GET /api/health/detailed`, admin only):

```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:4000/api/health/detailed

# Response (200 OK):
{
  "status": "ok",
  "api": {
    "uptime": 86400,
    "memory": { "heapUsed": 52428800, "heapTotal": 268435456 },
    "cpu": { "usage": 0.15 }
  },
  "dependencies": {
    "database": {
      "status": "connected",
      "latency": 2,
      "version": "15.1"
    },
    "redis": {
      "status": "connected",
      "latency": 1,
      "memoryUsage": 52428800
    }
  }
}
```

### Monitoring Health Checks

Configure external uptime monitoring:

**Uptime Robot** (Recommended):

1. Create monitor: https://uptimerobot.com/dashboard
2. Add HTTP monitor:
   - URL: `https://api.example.com/api/health`
   - Interval: Every 1 minute
   - Timeout: 30 seconds
3. Alert on: 3 consecutive failures

**Datadog Synthetics**:

```yaml
synthetic_tests:
  - name: "API Health Check"
    request:
      url: "https://api.example.com/api/health"
      method: "GET"
    assertions:
      - type: "statusCode"
        operator: "is"
        target: 200
      - type: "body"
        operator: "contains"
        target: "ok"
    options:
      tick_every: 60 # Check every 60s
      min_failure_duration: 300 # Alert after 5 min of failures
```

## Debugging Production Issues

### Finding Root Cause

**1. Check Health**:

```bash
curl https://api.example.com/api/health
```

**2. Review Sentry Errors**:

- Go to https://sentry.io → Issues
- Filter by release & time range
- Look for patterns

**3. Check Datadog Traces**:

- Go to https://datadoghq.com → APM → Traces
- Filter by error status, slow responses
- Click trace to view full details

**4. Review Logs**:

```bash
# View recent error logs
railway logs --level=error --follow

# Or for Fly.io
fly logs --app infamous-freight-api --follow
```

**5. Check Metrics**:

- CPU usage: Currently 75%? Was 10% before?
- Memory: Growing over time? Potential leak
- Database: Slow queries? Connection pool exhausted?
- Network: High latency? Bandwidth saturated?

### Common Issues & Solutions

#### High API Latency (P95 > 1s)

1. Check database slow queries:

   ```sql
   SELECT query, mean_time FROM pg_stat_statements
   ORDER BY mean_time DESC LIMIT 10;
   ```

2. Check cache hit rate:

   ```bash
   # Via Datadog
   avg:cache.hit_rate{service:api} < 0.5 (50%)
   ```

3. Check rate limiting:
   ```bash
   # Are requests being throttled?
   logs: "rate_limit_exceeded"
   ```

#### High Memory Usage (> 80% heap)

1. Check for memory leaks:

   ```javascript
   logger.info("Memory usage", {
     heapUsed: process.memoryUsage().heapUsed,
     heapTotal: process.memoryUsage().heapTotal,
     external: process.memoryUsage().external,
   });
   ```

2. Restart instance:

   ```bash
   railway restart
   ```

3. Enable Node profiling in Datadog

#### Database Connection Pool Exhausted

1. Check pool size (default: 10-20 connections)

   ```bash
   # In connection string: ?max_pool_size=30
   ```

2. Monitor active connections:

   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

3. Increase pool or restart API

#### 5XX Errors Spiking

1. Check Sentry for error messages
2. Review recent deployments
3. Check external service status (Stripe, SendGrid, etc.)
4. Rollback if recent deploy caused it

## Common Scenarios

### Scenario: API Out of Memory

1. **Alert triggered**: Memory > 80% for 10 min

2. **Investigate**:

   ```bash
   # View process memory
   ps aux | grep node

   # Check Datadog for trend
   # Is memory growing all the time? Leak suspected.
   ```

3. **Short-term fix**:

   ```bash
   # Restart API instance
   railway restart
   ```

4. **Long-term fix**:
   - Review recent code changes
   - Check for event listener leaks
   - Profile with Node --inspect
   - Deploy fix & redeploy

### Scenario: Database Queries Slow

1. **Alert triggered**: P95 query time > 500ms

2. **Investigate**:

   ```sql
   -- Slow query log
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   WHERE mean_time > 500
   ORDER BY mean_time DESC;
   ```

3. **Optimize**:
   - Add database indexes
   - Use Prisma `.include()` to prevent N+1 queries
   - Cache frequently accessed data

4. **Monitor**:
   - Datadog → APM → track query improvements

### Scenario: Rate Limit Attacks

1. **Alert triggered**: 429 responses spiking

2. **Investigate**:

   ```bash
   # Check which endpoints being hit
   logs: "status:429"

   # Check which IPs/users
   # Look for pattern (bot, script, mistake)
   ```

3. **Immediate action**:

   ```bash
   # Temporarily tighten rate limits
   # Or block IP via WAF (Cloudflare)
   ```

4. **Review**:
   - Do legitimate users affected?
   - Adjust limits based on usage patterns
   - Enable CAPTCHA if bot detected

---

**Support**:

- Sentry Docs: https://docs.sentry.io
- Datadog Docs: https://docs.datadoghq.com
- On-call: See incident runbooks
