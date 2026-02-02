# 🔍 Advanced Monitoring & Observability Setup

**Purpose**: Enterprise-grade monitoring for production workloads  
**Status**: Setup instructions for full observability  
**Integrations**: Sentry, Datadog, Vercel Analytics, Custom Dashboards

---

## 1️⃣ Error Tracking with Sentry

### Setup

```bash
# Install Sentry SDK
pnpm add @sentry/node @sentry/react @sentry/nextjs

# Create auth token
# Visit: https://sentry.io/auth/login/ → New token
# Scope: project:write, org:read
```

### Configuration

**API (apps/api/src/index.js)**:

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
});

// Express middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Web (apps/web/pages/_app.tsx)**:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    if (process.env.NEXT_PUBLIC_ENV === "development") {
      console.log("Sentry event:", event);
    }
    return event;
  },
});
```

### Environment Variables

```bash
# .env.local
SENTRY_DSN=https://xxxxx@sentry.io/1234567
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/1234567
```

### Monitoring

- **Dashboard**: <https://sentry.io/organizations/your-org/issues/>
- **Setup alerts**: Performance alerts, Release tracking, Custom thresholds

---

## 2️⃣ Performance Monitoring with Datadog

### Setup

```bash
# Install Datadog RUM & Logs
pnpm add @datadog/browser-rum @datadog/browser-logs

# Create account: https://www.datadoghq.com/
# Get API key from: Settings → API Keys
```

### Configuration

**Web (apps/web/pages/_app.tsx)**:

```typescript
import { datadogRum } from "@datadog/browser-rum";
import { datadogLogs } from "@datadog/browser-logs";

if (process.env.NEXT_PUBLIC_ENV === "production") {
  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DD_APP_ID!,
    clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
    site: process.env.NEXT_PUBLIC_DD_SITE || "datadoghq.com",
    service: "freight-web",
    env: process.env.NEXT_PUBLIC_ENV,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: "mask-user-input",
  });

  datadogRum.startSessionReplayRecording();
  datadogLogs.init({
    clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
    site: process.env.NEXT_PUBLIC_DD_SITE || "datadoghq.com",
    service: "freight-web",
    env: process.env.NEXT_PUBLIC_ENV,
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
  });
}
```

### API Monitoring

```javascript
// apps/api/src/middleware/datadog.js
const StatsD = require("hot-shots");

const dogstatsd = new StatsD({
  host: process.env.DD_AGENT_HOST || "localhost",
  port: process.env.DD_AGENT_PORT || 8125,
  prefix: "freight.api.",
  tags: [`env:${process.env.NODE_ENV}`],
});

// Middleware to track request metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    dogstatsd.histogram("request.duration", duration, {
      method: req.method,
      route: req.route?.path || "unknown",
      status: res.statusCode,
    });
  });
  
  next();
});
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_DD_APP_ID=xxxxx
NEXT_PUBLIC_DD_CLIENT_TOKEN=xxxxx
NEXT_PUBLIC_DD_SITE=datadoghq.com
DD_AGENT_HOST=localhost
DD_AGENT_PORT=8125
```

### Dashboards

- **RUM Dashboard**: <https://app.datadoghq.com/rum/explorer>
- **Metrics**: Response times, Error rates, User interactions
- **Session Replays**: Video playback of user sessions
- **Custom Dashboards**: Create custom metric views

---

## 3️⃣ Custom Health Checks

### Implementation

**apps/api/src/routes/health.js**:

```javascript
router.get("/health", async (req, res) => {
  const checks = {
    api: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "connected";
  } catch (err) {
    checks.database = "disconnected";
  }

  // Cache check
  try {
    await redis.ping();
    checks.cache = "connected";
  } catch (err) {
    checks.cache = "disconnected";
  }

  // External services check
  checks.external = {};
  
  try {
    const response = await fetch("https://api.stripe.com/v1/status", {
      timeout: 5000,
    });
    checks.external.stripe = response.ok ? "ok" : "degraded";
  } catch {
    checks.external.stripe = "unreachable";
  }

  const allHealthy = Object.values(checks).every(
    (v) => v === true || (typeof v === "object" && Object.values(v).every((s) => s !== "unreachable"))
  );

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(checks);
});

router.get("/health/ready", async (req, res) => {
  // Readiness check for load balancers
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

router.get("/health/live", (req, res) => {
  // Liveness check for Kubernetes
  res.status(200).json({ alive: true });
});
```

### Kubernetes Integration

```yaml
# k8s/deployment.yaml (if using K8s)
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 4000
  initialDelaySeconds: 10
  periodSeconds: 5
```

---

## 4️⃣ Alerting Strategy

### Sentry Alerts

1. Go to Project Settings → Alerts
2. Create rules:
   - **New JavaScript Error**: Notify #alerts
   - **High Error Rate**: > 5% errors in 1 hour
   - **Release Tracking**: Notify on new releases
   - **Resolving**: Update on ticket resolution

### Datadog Alerts

```python
# Monitor and create via Datadog UI
# Or use API:
curl -X POST https://api.datadoghq.com/api/v1/monitor \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -d '{
    "name": "High Error Rate",
    "type": "metric alert",
    "query": "avg(last_5m):avg:system.load{*} > 0.5",
    "thresholds": {"critical": 0.5},
    "notify_no_data": false
  }'
```

### Custom Alerts with GitHub Actions

```yaml
# .github/workflows/monitor-errors.yml
name: Error Monitoring
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  check-errors:
    runs-on: ubuntu-latest
    steps:
      - name: Check Sentry errors
        uses: actions/github-script@v6
        with:
          script: |
            const axios = require('axios');
            const response = await axios.get('https://sentry.io/api/0/organizations/your-org/issues/', {
              headers: { Authorization: `Bearer ${{ secrets.SENTRY_TOKEN }}` },
              params: { statsPeriod: '5m', query: 'is:unresolved' }
            });
            
            if (response.data.length > 10) {
              core.setFailed(`High error rate detected: ${response.data.length} recent errors`);
            }
```

---

## 5️⃣ Logging Strategy

### Structured Logging

```javascript
// apps/api/src/middleware/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "freight-api" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({
      filename: "combined.log",
      format: winston.format.printf(
        ({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
          }`;
        }
      ),
    }),
    process.env.NODE_ENV !== "production"
      ? new winston.transports.Console({
          format: winston.format.colorize(),
        })
      : null,
  ].filter(Boolean),
});

module.exports = logger;
```

### Log Levels

```javascript
logger.error("Payment processing failed", {
  shipmentId: "123",
  amount: 5000,
  error: err.message,
});

logger.warn("Rate limit approaching", {
  endpoint: "/api/shipments",
  currentRate: 95,
  limit: 100,
});

logger.info("Shipment created", {
  shipmentId: "124",
  customerId: "456",
  weight: 2500,
});

logger.debug("Database query", {
  query: "SELECT * FROM shipments",
  duration: 45,
});
```

---

## 6️⃣ Dashboard Setup

### Recommended Dashboards

**Performance Dashboard**:

- API response time (p50, p95, p99)
- Database query performance
- Cache hit rate
- Deployment frequency

**Error Dashboard**:

- Error rate by endpoint
- Top errors (Sentry integration)
- Error trend over time
- Error recovery time

**Business Dashboard**:

- Shipment count by day
- Revenue by region
- Customer acquisition cost
- Platform uptime percentage

### Creating Custom Dashboards

```javascript
// Use Datadog UI or API
const dashboard = {
  title: "Freight Platform",
  widgets: [
    {
      type: "timeseries",
      queries: [{ name: "API Latency", metric: "api.request.duration" }],
    },
    {
      type: "toplist",
      queries: [{ name: "Top Errors", metric: "errors" }],
    },
  ],
};
```

---

## 7️⃣ Verification Checklist

### Setup Verification

- [ ] Sentry project created & DSN configured
- [ ] Datadog account setup with API keys
- [ ] Environment variables in all environments
- [ ] Health check endpoints responding
- [ ] Alert channels configured (#alerts Slack)
- [ ] Custom dashboards created
- [ ] Test error sent to Sentry

### Post-Deployment

- [ ] Monitor error rates for 24 hours
- [ ] Verify alert triggers working
- [ ] Review performance baseline
- [ ] Confirm no sensitive data in logs
- [ ] Setup on-call rotation
- [ ] Document runbooks for key metrics

### Ongoing

- [ ] Review dashboards daily
- [ ] Archive old logs (monthly)
- [ ] Update alert thresholds based on trends
- [ ] Incident reviews trigger improvements
- [ ] Monthly SLA reviews

---

## 📊 Monitoring Metrics to Track

| Metric | Threshold | Tool | Action |
|--------|-----------|------|--------|
| Error Rate | < 0.1% | Sentry | Alert if exceeded |
| Response Time P95 | < 500ms | Datadog | Investigate if exceeded |
| Database Query Time | < 100ms | Datadog | Profile & optimize |
| Cache Hit Rate | > 80% | Datadog | Monitor trends |
| Deployment Success | > 98% | GitHub Actions | Review failures |
| Uptime | > 99.9% | Custom | Monthly SLA review |

---

## 🚀 Next Steps

1. **Enable Sentry**: Visit sentry.io, create project, get DSN
2. **Setup Datadog**: Create account, get API key
3. **Deploy monitoring code**: Merge changes to main
4. **Configure alerts**: Setup Slack notifications
5. **Create dashboards**: Build custom metric views
6. **Document runbooks**: Create incident response guides

---

**Status**: Ready to implement  
**Effort**: 2-3 hours to full setup  
**Benefit**: Complete visibility into production behavior
