# Monitoring Setup Guide

**Purpose:** Quick start guide for setting up monitoring and observability for the Infæmous Freight platform.

---

## Overview

Infæmous Freight uses multiple monitoring tools to ensure reliability and performance:

1. **Sentry** - Error tracking and performance monitoring
2. **Pino Logger** - Structured JSON logging
3. **Redis** - Cache monitoring
4. **Custom Metrics** - Application-specific metrics

---

## 1. Sentry Setup

### Installation

Sentry is already configured in the codebase. To activate it:

**Environment Variables:**

```bash
# .env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_ENV=production  # Sentry only active in production by default
```

**Configuration Location:**
- `apps/api/src/lib/monitoring.ts` - Main Sentry configuration
- `apps/api/src/config/sentry.js` - Legacy Sentry setup
- `apps/api/src/config/sentry-enhanced.js` - Enhanced Sentry with custom context

### Usage in Code

```typescript
import { logger } from '../lib/logger.js';

try {
  // Your code here
} catch (error) {
  // Sentry automatically captures errors via errorTracking middleware
  logger.error({ err: error }, "Operation failed");
  throw error;
}
```

### Features Enabled

- **Error Tracking** - Automatic error capture
- **Performance Monitoring** - Transaction tracking for API routes
- **Release Tracking** - Git commit SHA and version tags
- **User Context** - User ID and organization ID in error reports
- **Custom Tags** - Environment, service name, tenant ID

### Sentry Dashboard

Access your Sentry dashboard at: `https://sentry.io/organizations/your-org/projects/`

**Key Views:**
- **Issues** - All captured errors grouped by fingerprint
- **Performance** - API endpoint response times and throughput
- **Releases** - Error rates per deployment

---

## 2. Structured Logging (Pino)

### Configuration

Logging is configured in `apps/api/src/lib/logger.ts`

**Log Levels:**
- `debug` - Detailed debugging information (development only)
- `info` - General informational messages
- `warn` - Warning messages (non-critical issues)
- `error` - Error messages (requires attention)

**Environment Variables:**

```bash
LOG_LEVEL=info  # debug | info | warn | error
NODE_ENV=production  # Affects log format (JSON in prod, pretty in dev)
```

### Usage Examples

```typescript
import { logger } from '../lib/logger.js';

// Simple info log
logger.info('[JobName] Job started');

// Log with context
logger.info({ jobId: job.id, orgId: org.id }, '[JobName] Processing organization');

// Warning with error
logger.warn({ err: error, userId }, 'Failed to send notification');

// Error with full context
logger.error({
  err: error,
  orgId: org.id,
  invoiceId: invoice.id
}, 'Invoice generation failed');
```

### Log Aggregation

**Production Recommendations:**

Send logs to a centralized logging service:

1. **DataDog** - APM and log aggregation
   ```bash
   npm install dd-trace
   ```
   Then instrument at app startup.

2. **CloudWatch** (AWS) - Native AWS logging
   Use `pino-cloudwatch` transport

3. **Logtail** - Simple log aggregation
   Use `pino-logtail` transport

**Example: DataDog Integration**

```typescript
// apps/api/src/server.ts
import tracer from 'dd-trace';

if (env.nodeEnv === 'production') {
  tracer.init({
    service: 'infamous-freight-api',
    env: env.nodeEnv,
    version: process.env.npm_package_version,
  });
}
```

---

## 3. Application Metrics

### Redis Cache Monitoring

Monitor cache hit rates and memory usage:

```typescript
import { getCacheStats } from '../lib/redis.js';

// Get cache statistics
const stats = await getCacheStats();
console.log(`Cache Keys: ${stats.keys}, Memory: ${stats.memory} bytes`);
```

**Metrics to Track:**
- Cache hit rate
- Cache miss rate
- Memory usage
- Key count
- Eviction rate

### Custom Metrics

Location: `apps/api/src/middleware/metricsRecorder.js`

**Available Metrics:**
- Request count by endpoint
- Response time (p50, p95, p99)
- Error rate by status code
- Database query duration
- External API call duration

**Accessing Metrics:**

Metrics are exposed via the `/metrics` endpoint (if configured):

```bash
curl http://localhost:4000/metrics
```

---

## 4. Health Checks

### API Health Endpoint

**Endpoint:** `GET /health`

**Response:**
```json
{
  "ok": true,
  "timestamp": "2026-03-16T10:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Docker Health Check

The API Dockerfile includes a health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

### Smoke Test Script

Location: `scripts/smoke.sh`

```bash
BASE_URL=http://localhost:4000 bash scripts/smoke.sh
```

---

## 5. Alert Configuration

### Sentry Alerts

Configure in Sentry dashboard:

1. Navigate to **Alerts** → **Create Alert**
2. Set conditions:
   - Error rate exceeds threshold
   - New error introduced
   - Performance degradation (p95 > 500ms)

### Recommended Alert Rules

**Critical Alerts:**
- Error rate > 1% for 5 minutes
- Any error in payment processing
- Database connection failures
- Redis connection failures

**Warning Alerts:**
- Response time p95 > 1000ms for 10 minutes
- Memory usage > 80%
- CPU usage > 80%
- Disk usage > 85%

### Notification Channels

Configure in environment:

```bash
# Slack webhook for notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email for critical alerts (via Sentry)
SENTRY_ALERT_EMAIL=ops@infamousfreight.com
```

---

## 6. Monitoring Dashboard

### Key Metrics to Monitor

**Application Health:**
- ✅ API uptime percentage
- ✅ Response time (p50, p95, p99)
- ✅ Error rate
- ✅ Request throughput (req/min)

**Infrastructure Health:**
- ✅ CPU usage
- ✅ Memory usage
- ✅ Disk I/O
- ✅ Network I/O

**Business Metrics:**
- ✅ Active users
- ✅ Invoices generated (monthly)
- ✅ Failed payments
- ✅ Job queue length

### Grafana Dashboard (Optional)

If using Prometheus + Grafana:

1. Install Prometheus client:
   ```bash
   npm install prom-client
   ```

2. Expose metrics endpoint:
   ```typescript
   import client from 'prom-client';

   app.get('/metrics', async (req, res) => {
     res.set('Content-Type', client.register.contentType);
     res.end(await client.register.metrics());
   });
   ```

---

## 7. Debugging Production Issues

### Step 1: Check Sentry

1. Go to Sentry dashboard
2. Filter by environment: `production`
3. Look for recent error spikes

### Step 2: Check Logs

**Using structured logs:**

```bash
# Filter logs by level
cat api.log | jq 'select(.level == "error")'

# Filter by request ID
cat api.log | jq 'select(.requestId == "123e4567-e89b-12d3-a456-426614174000")'

# Filter by organization
cat api.log | jq 'select(.orgId == "org_123")'
```

### Step 3: Check Health Endpoint

```bash
curl https://api.infamousfreight.com/health
```

### Step 4: Check Redis

```bash
# Connect to Redis
redis-cli -h localhost -p 6379

# Check memory usage
INFO memory

# Check connected clients
CLIENT LIST

# Check slow queries
SLOWLOG GET 10
```

---

## 8. Performance Monitoring

### Request Tracing

Use correlation IDs for distributed tracing:

```typescript
import { logger } from '../lib/logger.js';

const log = logger.child({
  correlationId: req.headers['x-correlation-id'],
  requestId: req.requestId,
});

log.info('Processing request');
```

### Database Query Monitoring

Location: `apps/api/src/middleware/queryMonitoring.js`

Monitors:
- Query duration
- Slow queries (> 100ms)
- Query patterns

### External API Monitoring

Track third-party API performance:

```typescript
const startTime = Date.now();
try {
  const response = await fetch(externalApiUrl);
  const duration = Date.now() - startTime;

  logger.info({
    externalApi: 'stripe',
    durationMs: duration,
    statusCode: response.status
  }, 'External API call completed');
} catch (err) {
  logger.error({ externalApi: 'stripe', err }, 'External API call failed');
}
```

---

## 9. Troubleshooting

### Common Issues

**Issue: Logs not appearing in Sentry**
- Check `SENTRY_DSN` is set correctly
- Verify `NODE_ENV=production` (Sentry disabled in development by default)
- Check network connectivity to sentry.io

**Issue: High memory usage**
- Check Redis memory usage: `getCacheStats()`
- Review cache TTL settings
- Check for memory leaks using `node --inspect`

**Issue: Slow API responses**
- Check Sentry Performance dashboard for slow transactions
- Review database query performance
- Check Redis connection latency

---

## 10. Quick Reference

### Environment Variables

```bash
# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=info

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Infrastructure
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...
```

### Useful Commands

```bash
# Check API health
curl http://localhost:4000/health

# View logs (structured)
tail -f api.log | jq '.'

# Test Sentry integration
curl -X POST http://localhost:4000/test-error

# Check Redis stats
redis-cli INFO stats
```

### Important Files

- `apps/api/src/lib/logger.ts` - Logging configuration
- `apps/api/src/lib/monitoring.ts` - Sentry configuration
- `apps/api/src/middleware/errorTracking.js` - Error handling
- `apps/api/src/lib/redis.ts` - Cache monitoring

---

## Next Steps

1. **Set up Sentry account** and configure `SENTRY_DSN`
2. **Configure Slack webhook** for notifications
3. **Set up log aggregation** (DataDog, CloudWatch, or Logtail)
4. **Create Sentry alert rules** for critical errors
5. **Set up uptime monitoring** (Pingdom, UptimeRobot, etc.)
6. **Review metrics dashboard** weekly

---

**Last Updated:** March 16, 2026
**Maintainer:** DevOps Team
**Related Docs:**
- `SENTRY_MONITORING.md` - Detailed Sentry setup
- `MONITORING_OBSERVABILITY_SETUP.md` - Comprehensive monitoring guide
- `ONGOING_MONITORING.md` - Production monitoring procedures
