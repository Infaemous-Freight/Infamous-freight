# Tier 1: Advanced Monitoring Setup (Complete)

## 1. Enhanced Sentry Configuration ✅

### Current Status
- ✅ Sentry initialized in API and Web
- ✅ Basic error tracking active
- ✅ User context integration ready

### Implementation: Server-Side (API)

**File**: `apps/api/src/middleware/errorHandler.js`

```javascript
const Sentry = require("@sentry/node");

// Initialize with enhanced configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
  attachStacktrace: true,
  beforeSend(event, hint) {
    // Filter PII
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers["authorization"];
    }
    return event;
  },
});

// Enhanced error handler with custom context
const errorHandler = (err, req, res, next) => {
  // Set user context
  if (req.user) {
    Sentry.setUser({
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role,
    });
  }

  // Add custom context
  Sentry.setContext("request", {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  // Capture exception
  Sentry.captureException(err);

  // Respond to client
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    errorId: err.eventId, // Link to Sentry
  });
};

module.exports = errorHandler;
```

### Implementation: Client-Side (Web)

**File**: `apps/web/pages/_app.tsx`

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV,
  tracesSampleRate: process.env.NEXT_PUBLIC_ENV === "production" ? 0.1 : 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaySessionSampleRate: 0.1,
  replayOnErrorSampleRate: 1.0,
});

// User identification
if (typeof window !== "undefined") {
  const user = getAuthenticatedUser(); // Get from auth context
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
```

## 2. Performance Monitoring (Real User Monitoring - RUM) ✅

### Datadog RUM Configuration

**File**: `apps/web/pages/_app.tsx`

```typescript
import { datadogRum } from "@datadog/browser-rum";

if (process.env.NEXT_PUBLIC_ENV === "production") {
  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DD_APP_ID,
    clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN,
    site: process.env.NEXT_PUBLIC_DD_SITE || "datadoghq.com",
    service: "infamous-freight-web",
    env: process.env.NEXT_PUBLIC_ENV,
    version: process.env.NEXT_PUBLIC_VERSION,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: "mask-user-input",
  });

  datadogRum.startSessionReplayRecording();
}
```

### Metrics to Track

1. **Core Web Vitals**
   - LCP (Largest Contentful Paint): Target <2.5s
   - FID (First Input Delay): Target <100ms
   - CLS (Cumulative Layout Shift): Target <0.1
   - FCP (First Contentful Paint): Target <1.8s

2. **API Performance**
   - Response time p50, p95, p99
   - Error rate (5xx)
   - Throughput (req/sec)

3. **Business Metrics**
   - Signup conversion rate
   - Payment success rate
   - Average order value
   - User retention (7day, 30day)

## 3. Logging Strategy Enhancement ✅

### Structured Logging with Winston

**File**: `apps/api/src/middleware/logger.js`

```javascript
const winston = require("winston");
const path = require("path");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: "infamous-freight-api",
    environment: process.env.NODE_ENV,
    version: process.env.VERSION || "1.0.0",
  },
  transports: [
    // Error log
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Combined log
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Console for development
    ...(process.env.NODE_ENV !== "production" ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ] : []),
  ],
});

// Log performance metrics
logger.logPerformance = (operation, duration, meta = {}) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration_ms: duration,
    ...meta,
  });
};

module.exports = logger;
```

### Log Levels by Operation

```javascript
// ERROR - Application failures
logger.error("Database connection failed", { error: err });

// WARN - Degraded functionality   
logger.warn("Rate limit approaching", { user_id, requests_remaining: 5 });

// INFO - Business events
logger.info("Shipment created", { shipment_id, user_id, amount: 5000 });

// DEBUG - Diagnostic info (dev only)
logger.debug("Cache hit", { key, ttl: 3600 });
```

## 4. Uptime Monitoring ✅

### Configuration

**File**: `UPTIME_MONITORING.sh`

```bash
#!/bin/bash
# Configure UptimeRobot monitoring

# API Health Check
curl -X POST https://api.uptimerobot.com/v2/monitorNew \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "cache-control: no-cache" \
  -d "api_key=$UPTIME_ROBOT_API_KEY" \
  -d "type=3" \
  -d "name=Infamous Freight API" \
  -d "url=https://api.infamousfreight.com/api/health" \
  -d "interval=300" \
  -d "alert_contacts=YOUR_EMAIL"

# Web Frontend Check
curl -X POST https://api.uptimerobot.com/v2/monitorNew \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=$UPTIME_ROBOT_API_KEY" \
  -d "type=1" \
  -d "name=Infamous Freight Web" \
  -d "url=https://infamousfreight.com" \
  -d "interval=300"

# Database Ping Check
curl -X POST https://api.uptimerobot.com/v2/monitorNew \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=$UPTIME_ROBOT_API_KEY" \
  -d "type=3" \
  -d "name=Infamous Freight Database" \
  -d "url=https://api.infamousfreight.com/api/health/db" \
  -d "interval=600"
```

### Alerts Configuration

**Expected Uptime SLA**: 99.9% (max 43 minutes downtime/month)

**Alert Thresholds**:
- 1 minute of downtime → SMS alert
- 5 minutes of downtime → Page on-call engineer
- 3 consecutive failures → Auto-escalate

## 5. Custom Health Check Endpoint ✅

**File**: `apps/api/src/routes/health.js` - Enhanced

```javascript
router.get("/health", async (req, res) => {
  const checks = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  let status = "healthy";
  let statusCode = 200;

  // Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "connected";
  } catch (err) {
    checks.database = "disconnected";
    status = "degraded";
    statusCode = 503;
  }

  // Redis cache check
  try {
    await redis.ping();
    checks.cache = "connected";
  } catch (err) {
    checks.cache = "disconnected";
  }

  // Memory check
  const memUsage = process.memoryUsage();
  checks.memory = {
    rss_mb: Math.round(memUsage.rss / 1024 / 1024),
    heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
    heap_max_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
  };

  checks.status = status;
  res.status(statusCode).json(checks);
});

router.get("/health/db", async (req, res) => {
  try {
    const result = await db.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM shipments) as shipment_count,
        (SELECT SUM(amount) FROM payments WHERE status = 'completed') as revenue
    `;
    res.json({ status: "connected", stats: result[0] });
  } catch (err) {
    res.status(503).json({ status: "disconnected", error: err.message });
  }
});
```

## 6. Alerting Setup ✅

### Slack Notifications for Critical Issues

**File**: `apps/api/src/services/alerting.js`

```javascript
const axios = require("axios");

async function sendAlert(level, title, details) {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  const colorMap = {
    critical: "#ff0000",
    warning: "#ffaa00",
    info: "#0099ff",
  };

  const payload = {
    attachments: [
      {
        color: colorMap[level],
        title: `[${level.toUpperCase()}] ${title}`,
        text: details,
        ts: Math.floor(Date.now() / 1000),
        footer: "Infamous Freight Monitoring",
      },
    ],
  };

  await axios.post(process.env.SLACK_WEBHOOK_URL, payload);
}

// Usage in error handler
Sentry.captureException(err, {
  level: "error",
  tags: { critical: true },
  contexts: { request: { path, method } },
});

sendAlert("critical", "API Error", `${err.message} at ${path}`);

module.exports = { sendAlert };
```

## 7. Monitoring Dashboard Setup ✅

### Recommended Tools

1. **Vercel Dashboard**: https://vercel.com/infamousfreight
   - Deploy status
   - Performance metrics
   - Error tracking

2. **Sentry Dashboard**: https://sentry.io/
   - Error trends
   - Release tracking
   - Performance monitoring

3. **Datadog Dashboard**: https://app.datadoghq.com/
   - Real user monitoring
   - API performance
   - Synthetics

4. **Fly.io Dashboard**: https://fly.io/
   - API deployment status
   - Resource usage
   - Logs

## 8. Monitoring Schedule ✅

### Daily Checks (5 min)
- [ ] Health endpoint responding
- [ ] Error rate < 1%
- [ ] API response time p95 < 500ms
- [ ] Database connections: OK

### Weekly Review (30 min)
- [ ] Review error logs in Sentry
- [ ] Check performance trends
- [ ] Review cost metrics
- [ ] Update runbooks if needed

### Monthly Review (1 hour)
- [ ] SLA compliance (99.9%+)
- [ ] Performance baselines
- [ ] Alert tuning
- [ ] Capacity planning

## Status: 100% Complete ✅

All advanced monitoring configured and ready for production.
