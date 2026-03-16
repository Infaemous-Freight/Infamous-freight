# Sentry & Monitoring Integration Guide

## Overview

This guide documents the Sentry error tracking and monitoring integration for
Infæmous Freight Enterprises API. Sentry provides real-time error tracking,
performance monitoring, and alerting capabilities.

## Configuration

### Environment Variables

```bash
# Required for Sentry integration
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0

# Optional monitoring configuration
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
SENTRY_ENVIRONMENT=production   # Sets environment tag
SENTRY_RELEASE=1.0.0           # Application version
```

### Initialization

```javascript
// apps/api/src/config/sentry.js
const Sentry = require("@sentry/node");

function initSentry(app) {
  if (!process.env.SENTRY_DSN) {
    console.warn("Sentry DSN not configured - error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || "development",
    release: process.env.SENTRY_RELEASE,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new Sentry.Integrations.Prisma(),
    ],
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 1.0,
  });
}

module.exports = { initSentry };
```

## Error Capture Patterns

### Automatic Capture

Errors are automatically captured from:

- Unhandled exceptions
- Promise rejections
- Route errors via `next(error)` pattern
- Request/response logging middleware

### Manual Capture

```javascript
// Capture specific exceptions
Sentry.captureException(new Error("Custom error"), {
  tags: {
    section: "billing",
    action: "stripe_charge",
  },
  level: "error",
});

// Capture messages
Sentry.captureMessage("User action detected", "info");

// Capture with context
Sentry.withScope((scope) => {
  scope.setContext("shipment", {
    id: shipment.id,
    status: shipment.status,
  });
  Sentry.captureException(err);
});
```

## Request Context

### Setting User Context

```javascript
// In authentication middleware
Sentry.setUser({
  id: req.user.sub,
  email: req.user.email,
  username: req.user.name,
  ip_address: req.ip,
});
```

### Adding Request Tags

```javascript
// In request middleware
Sentry.setTag("route", req.path);
Sentry.setTag("method", req.method);
Sentry.setTag("environment", process.env.NODE_ENV);
```

### Adding Request Context

```javascript
// In errorHandler middleware
Sentry.setContext("http", {
  method: req.method,
  url: req.originalUrl,
  query: req.query,
  headers: req.headers,
  ip: req.ip,
  statusCode: res.statusCode,
  duration: req.endTime - req.startTime,
});
```

## Error Categorization

### By Error Type

```javascript
// Validation errors (info level)
if (error.status === 400) {
  Sentry.captureException(error, {
    level: "info",
    tags: { category: "validation" },
  });
}

// Auth errors (warning level)
if (error.status === 401 || error.status === 403) {
  Sentry.captureException(error, {
    level: "warning",
    tags: { category: "authentication" },
  });
}

// Server errors (error level)
if (error.status >= 500) {
  Sentry.captureException(error, {
    level: "error",
    tags: { category: "server_error" },
  });
}
```

### By Feature

```javascript
// AI Service errors
try {
  const response = await aiClient.sendCommand(command);
} catch (err) {
  Sentry.captureException(err, {
    tags: {
      feature: "ai_command",
      provider: process.env.AI_PROVIDER,
      command: command.type,
    },
    contexts: {
      ai_command: {
        type: command.type,
        provider: process.env.AI_PROVIDER,
      },
    },
  });
}

// Billing Service errors
try {
  const session = await stripe.checkout.sessions.create(params);
} catch (err) {
  Sentry.captureException(err, {
    tags: {
      feature: "billing",
      service: "stripe",
    },
  });
}

// Voice Service errors
try {
  const transcription = await openai.audio.transcriptions.create(params);
} catch (err) {
  Sentry.captureException(err, {
    tags: {
      feature: "voice",
      service: "openai",
      language: params.language,
    },
  });
}
```

## Performance Monitoring

### Transaction Tracking

```javascript
// Start a transaction for complex operations
const transaction = Sentry.startTransaction({
  op: "shipment.optimize",
  name: "Shipment Route Optimization",
  tags: {
    feature: "ai_commands",
  },
});

try {
  // Add span for data retrieval
  const dataSpan = transaction.startChild({
    op: "db.query",
    description: "Load shipments for optimization",
  });
  const shipments = await prisma.shipment.findMany();
  dataSpan.finish();

  // Add span for AI processing
  const aiSpan = transaction.startChild({
    op: "ai.inference",
    description: "AI route optimization",
  });
  const optimization = await aiClient.optimize(shipments);
  aiSpan.finish();

  transaction.finish();
} catch (err) {
  transaction.finish();
  throw err;
}
```

### Database Query Monitoring

```javascript
// Prisma integration automatically monitors queries
// Slow queries (>1s) are flagged for investigation

// Manually track specific queries
const span = Sentry.startTransaction({
  op: "db.query",
  name: "Heavy Aggregation",
});

const result = await prisma.shipment.aggregation();

span.finish();
```

## Alert Configuration

### Recommended Alert Rules

1. **Critical Errors** (5xx)
   - Alert threshold: 5 errors in 5 minutes
   - Notification: Immediate (Slack, PagerDuty)

2. **Validation Failures** (400)
   - Alert threshold: 50 errors in 15 minutes
   - Notification: Daily digest

3. **Authentication Issues** (401/403)
   - Alert threshold: 20 errors in 10 minutes
   - Notification: Immediate (possible attack)

4. **Performance Degradation**
   - Alert threshold: p95 latency > 2s
   - Notification: Immediate

### Sentry Alert Setup

```javascript
// In Sentry Dashboard
1. Go to Alerts → Create Alert Rule
2. Set condition: Error count > 5 in 5 minutes
3. Filter: tags.environment:production
4. Action: Send to Slack channel #alerts
5. Filter: tags.severity:critical
```

## Integration with Logging

### Correlation IDs

```javascript
// Generate unique request ID for tracing
const requestId = require("uuid").v4();
Sentry.setTag("request_id", requestId);

// Include in logs
logger.info({
  msg: "Request received",
  requestId,
  path: req.path,
  method: req.method,
});
```

### Structured Logging with Sentry

```javascript
// apps/api/src/middleware/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Send errors to both Winston and Sentry
function logError(error, context = {}) {
  logger.error({ error: error.message, ...context });
  Sentry.captureException(error, { contexts: { logging: context } });
}
```

## Privacy & Security

### Sensitive Data Filtering

```javascript
// In beforeSend hook - strip sensitive data
Sentry.init({
  beforeSend(event, hint) {
    // Remove passwords from event data
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["x-api-key"];
    }

    // Remove PII from contexts
    if (event.contexts?.http) {
      event.contexts.http.query = null;
      event.contexts.http.headers = null;
    }

    return event;
  },
});
```

### GDPR Compliance

- Sentry stores IP addresses by default (GDPR consideration)
- Disable IP collection: `sendClientReports: false` in config
- Configure data retention in Sentry dashboard (default: 90 days)
- Use `allowUrls` and `denyUrls` to filter events

```javascript
Sentry.init({
  // Only capture errors from your domain
  allowUrls: [/https?:\/\/(www\.)?example\.com/],

  // Ignore errors from certain URLs
  denyUrls: [/https?:\/\/cdn\.jsdelivr\.net/, /extension\//],
});
```

## Development vs Production

### Development Configuration

```javascript
// Disable Sentry in development by default
if (process.env.NODE_ENV === "development") {
  process.env.SENTRY_TRACES_SAMPLE_RATE = "0"; // No transaction sampling
  process.env.SENTRY_ENVIRONMENT = "development";
}
```

### Production Configuration

```javascript
// In production, enable full monitoring
if (process.env.NODE_ENV === "production") {
  process.env.SENTRY_TRACES_SAMPLE_RATE = "0.1"; // 10% sampling
  process.env.SENTRY_ENVIRONMENT = "production";

  // Enable release tracking
  process.env.SENTRY_RELEASE = require("../package.json").version;
}
```

## Testing Sentry Integration

### Verify Configuration

```bash
# Test Sentry connection
NODE_ENV=development node -e "
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  Sentry.captureMessage('Test message');
  console.log('Sentry connected');
"
```

### Test Error Capture

```javascript
// In route handler for testing
app.get("/api/test-error", (req, res) => {
  try {
    throw new Error("Test error for Sentry");
  } catch (err) {
    Sentry.captureException(err);
    res.status(500).json({ error: "Test error sent to Sentry" });
  }
});
```

## Dashboard Usage

### Issue Tracking

1. **Inbox** - New errors requiring investigation
2. **Issues** - Grouped errors with history
3. **Alerts** - Configured alert rules and status
4. **Performance** - Transaction slowdowns

### Debugging Tools

- **Session Replay** - Watch user interactions leading to error
- **Breadcrumbs** - Timeline of events before error
- **Tags** - Filter issues by environment, feature, user
- **Charts** - Error trends over time

## References

- [Sentry Documentation](https://docs.sentry.io/platforms/node/)
- [Express.js Integration](https://docs.sentry.io/platforms/node/guides/express/)
- [Prisma Integration](https://docs.sentry.io/platforms/node/guides/prisma/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
