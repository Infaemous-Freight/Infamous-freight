# Comprehensive Observability Stack Guide

## Overview

This guide implements distributed tracing, metrics collection, service dependency mapping, and automated alerting using industry-standard tools.

## 1. Distributed Tracing with Jaeger

### Installation

```bash
pnpm add jaeger-client opentelemetry-api opentelemetry-sdk-node \
  @opentelemetry/auto-instrumentation-node \
  @opentelemetry/sdk-trace-node \
  @opentelemetry/exporter-trace-jaeger
```

### Setup Jaeger Tracer

**File: `api/src/config/tracer.js`**

```javascript
const jaeger = require('jaeger-client');
const initTracer = require('jaeger-client').initTracer;

const config = {
  serviceName: 'infamous-freight-api',
  sampler: {
    type: process.env.JAEGER_SAMPLER_TYPE || 'const',
    param: process.env.JAEGER_SAMPLER_PARAM || 1,
  },
  reporter: {
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    maxPacketSize: 65000,
    agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
    agentPort: process.env.JAEGER_AGENT_PORT || 6831,
  },
  tags: {
    'environment': process.env.NODE_ENV || 'development',
    'service.version': '2.2.0',
  },
};

const options = {
  logger: console,
  sampler: {
    type: 'const',
    param: 1,
  },
};

const tracer = initTracer(config, options);

module.exports = tracer;
```

### Tracing Middleware

**File: `api/src/middleware/tracing.js`**

```javascript
const tracer = require('../config/tracer');
const opentracing = require('opentracing');

function tracingMiddleware(req, res, next) {
  const wireCtx = tracer.extract(
    opentracing.FORMAT_HTTP_HEADERS,
    req.headers
  );

  const span = tracer.startSpan(req.path, {
    childOf: wireCtx,
    tags: {
      'span.kind': 'server',
      'http.method': req.method,
      'http.url': req.url,
      'http.client_ip': req.ip,
    },
  });

  // Inject span context for downstream calls
  req.span = span;

  res.on('finish', () => {
    span.setTag('http.status_code', res.statusCode);
    span.finish();
  });

  next();
}

module.exports = { tracingMiddleware, tracer };
```

### Trace Database Operations

**File: `api/src/config/tracedPrisma.js`**

```javascript
const { PrismaClient } = require('@prisma/client');
const { tracer } = require('../middleware/tracing');
const opentracing = require('opentracing');

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  const span = tracer.startSpan(`db.${params.model}.${params.action}`, {
    tags: {
      'db.type': 'sql',
      'db.system': 'postgresql',
      'db.statement': JSON.stringify(params.args),
    },
  });

  try {
    const result = await next(params);
    span.setTag('db.result.rows', Array.isArray(result) ? result.length : 1);
    span.finish();
    return result;
  } catch (err) {
    span.setTag('error', true);
    span.setTag('error.kind', err.constructor.name);
    span.log({
      event: 'error',
      'error.object': err,
    });
    span.finish();
    throw err;
  }
});

module.exports = prisma;
```

### Trace HTTP Calls

**File: `api/src/services/httpClient.js`**

```javascript
const axios = require('axios');
const { tracer } = require('../middleware/tracing');
const opentracing = require('opentracing');

const client = axios.create();

client.interceptors.request.use((config) => {
  const span = tracer.startSpan(`http.${config.method.toUpperCase()}`, {
    tags: {
      'span.kind': 'client',
      'http.url': config.url,
      'http.method': config.method,
    },
  });

  config.span = span;

  // Inject trace context
  tracer.inject(span, opentracing.FORMAT_HTTP_HEADERS, config.headers);

  return config;
});

client.interceptors.response.use(
  (response) => {
    const { span } = response.config;
    if (span) {
      span.setTag('http.status_code', response.status);
      span.finish();
    }
    return response;
  },
  (error) => {
    const span = error.config?.span;
    if (span) {
      span.setTag('error', true);
      span.setTag('http.status_code', error.response?.status || 0);
      span.finish();
    }
    return Promise.reject(error);
  }
);

module.exports = client;
```

## 2. Metrics Collection with Prometheus

### Installation

```bash
pnpm add prom-client
```

### Setup Prometheus Metrics

**File: `api/src/config/metrics.js`**

```javascript
const client = require('prom-client');

// Default metrics
client.collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['model', 'action'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
});

const cacheHitRate = new client.Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage',
  labelNames: ['cache_name'],
});

const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of active users',
});

const queueLength = new client.Gauge({
  name: 'queue_length',
  help: 'Job queue length',
  labelNames: ['queue_name'],
});

const errorRate = new client.Counter({
  name: 'errors_total',
  help: 'Total errors',
  labelNames: ['type', 'severity'],
});

module.exports = {
  client,
  httpRequestDuration,
  httpRequestTotal,
  dbQueryDuration,
  cacheHitRate,
  activeUsers,
  queueLength,
  errorRate,
  register: client.register,
};
```

### Metrics Middleware

**File: `api/src/middleware/metrics.js`**

```javascript
const { httpRequestDuration, httpRequestTotal } = require('../config/metrics');

function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });

  next();
}

module.exports = { metricsMiddleware };
```

### Metrics Endpoint

**File: `api/src/routes/admin.metrics.js`**

```javascript
const express = require('express');
const router = express.Router();
const { register } = require('../config/metrics');
const { authenticate, requireRole } = require('../middleware/security');

// Prometheus metrics endpoint
router.get('/metrics', authenticate, requireRole('admin'), async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

module.exports = router;
```

## 3. Service Dependency Mapping

### Dependency Graph

**File: `api/src/services/serviceMesh.js`**

```javascript
class ServiceMesh {
  constructor() {
    this.dependencies = new Map();
    this.calls = new Map();
    this.errors = new Map();
  }

  // Record service call
  recordCall(from, to, duration, success = true) {
    const key = `${from}->${to}`;

    if (!this.calls.has(key)) {
      this.calls.set(key, []);
    }

    this.calls.get(key).push({ duration, timestamp: Date.now() });

    if (!success) {
      if (!this.errors.has(key)) {
        this.errors.set(key, 0);
      }
      this.errors.set(key, this.errors.get(key) + 1);
    }
  }

  // Get service map
  getServiceMap() {
    const services = new Set();
    const connections = [];

    for (const [key, calls] of this.calls.entries()) {
      const [from, to] = key.split('->');
      services.add(from);
      services.add(to);

      const avgDuration =
        calls.reduce((sum, c) => sum + c.duration, 0) / calls.length;
      const errorRate = (this.errors.get(key) || 0) / calls.length;

      connections.push({
        from,
        to,
        calls: calls.length,
        avgDuration,
        errorRate,
      });
    }

    return {
      services: Array.from(services),
      connections,
    };
  }

  // Health check for service
  getServiceHealth(serviceName) {
    let totalCalls = 0;
    let failedCalls = 0;

    for (const [key, calls] of this.calls.entries()) {
      if (key.includes(serviceName)) {
        totalCalls += calls.length;
      }
    }

    for (const [key, errors] of this.errors.entries()) {
      if (key.includes(serviceName)) {
        failedCalls += errors;
      }
    }

    return {
      serviceName,
      totalCalls,
      failedCalls,
      successRate:
        totalCalls > 0 ? ((totalCalls - failedCalls) / totalCalls) * 100 : 0,
    };
  }
}

module.exports = new ServiceMesh();
```

### Service Map Endpoint

**File: `api/src/routes/admin.servicemap.js`**

```javascript
const express = require('express');
const router = express.Router();
const serviceMesh = require('../services/serviceMesh');
const { authenticate, requireRole } = require('../middleware/security');

// Get service map
router.get(
  '/admin/service-map',
  authenticate,
  requireRole('admin'),
  (req, res) => {
    const map = serviceMesh.getServiceMap();
    res.json(map);
  }
);

// Get service health
router.get(
  '/admin/service/:name/health',
  authenticate,
  requireRole('admin'),
  (req, res) => {
    const health = serviceMesh.getServiceHealth(req.params.name);
    res.json(health);
  }
);

module.exports = router;
```

## 4. Automated Alerting

### Alert Rules (Prometheus)

**File: `api/monitoring/prometheus-alerts.yml`**

```yaml
groups:
  - name: application_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          rate(errors_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'High error rate detected'
          description: 'Error rate is {{ $value }}'

      # High latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High latency detected'
          description: 'P95 latency is {{ $value }}s'

      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          process_resident_memory_bytes / 1024 / 1024 > 512
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High memory usage'
          description: 'Memory usage is {{ $value }}MB'

      # Database connection pool exhausted
      - alert: DBConnectionPoolExhausted
        expr: |
          pg_stat_activity_count >= 90
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: 'Database connection pool nearly exhausted'
          description: '{{ $value }} connections in use'

      # Service unreachable
      - alert: ServiceUnreachable
        expr: |
          up{job="api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'Service unreachable'
          description: 'Service has been down for 1 minute'
```

### Alert Handler

**File: `api/src/services/alertService.js`**

```javascript
const axios = require('axios');
const winston = require('winston');

class AlertService {
  async sendAlert(alert, channel = 'slack') {
    const message = this.formatAlert(alert);

    if (channel === 'slack') {
      await this.sendSlack(message);
    } else if (channel === 'email') {
      await this.sendEmail(message);
    } else if (channel === 'pagerduty') {
      await this.sendPagerDuty(message);
    }

    winston.warn('Alert sent', { alert, channel });
  }

  formatAlert(alert) {
    return {
      title: alert.labels.alertname,
      severity: alert.labels.severity,
      description: alert.annotations.description,
      timestamp: new Date(alert.startsAt).toISOString(),
    };
  }

  async sendSlack(message) {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      color:
        message.severity === 'critical'
          ? '#FF0000'
          : message.severity === 'warning'
            ? '#FFA500'
            : '#00FF00',
      title: message.title,
      text: message.description,
      ts: message.timestamp,
    });
  }

  async sendEmail(message) {
    // Use email service
    await sendEmail(process.env.ALERT_EMAIL, message.title, message.description);
  }

  async sendPagerDuty(message) {
    await axios.post('https://events.pagerduty.com/v2/enqueue', {
      routing_key: process.env.PAGERDUTY_ROUTING_KEY,
      event_action: 'trigger',
      payload: {
        summary: message.title,
        severity: message.severity,
        source: 'infamous-freight-api',
        custom_details: message,
      },
    });
  }
}

module.exports = new AlertService();
```

## 5. Datadog Integration

### Datadog Tracer

**File: `api/src/config/datadogTracer.js`**

```javascript
const tracer = require('dd-trace').init({
  service: 'infamous-freight-api',
  version: '2.2.0',
  env: process.env.NODE_ENV || 'development',
  hostname: process.env.HOSTNAME || 'localhost',
});

// Enable automatic instrumentation
tracer.use('http', {
  service: 'infamous-freight-api',
  headers: true,
});

tracer.use('pg', {
  service: 'postgres',
  splitByEndpoint: true,
});

tracer.use('express', {
  service: 'infamous-freight-api',
  headers: true,
});

module.exports = tracer;
```

### Custom Events

```javascript
const tracer = require('./config/datadogTracer');

// Track business events
tracer.trace('shipment.created', async (span) => {
  span.setTag('shipment.id', shipment.id);
  span.setTag('shipment.weight', shipment.weight);
  span.setTag('user.id', req.user.sub);

  // Your business logic
  await createShipment(shipment);

  span.finish();
});
```

## 6. Logging Aggregation

### Winston + Datadog

**File: `api/src/middleware/logger.js`**

```javascript
const winston = require('winston');
const DatadogTransport = require('winston-datadog-transport');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new DatadogTransport({
      apiKey: process.env.DATADOG_API_KEY,
      service: 'infamous-freight-api',
      source: 'nodejs',
      env: process.env.NODE_ENV || 'development',
    }),
  ],
});

// Add request correlation IDs
logger.addRequestIdMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  res.setHeader('X-Correlation-ID', req.correlationId);

  // Add to all log entries
  logger.defaultMeta = { correlationId: req.correlationId };

  next();
};

module.exports = logger;
```

## 7. Grafana Dashboard

### Import Dashboard

1. Go to `http://localhost:3000/` (Grafana default)
2. Click "+" → "Import"
3. Paste dashboard JSON or import from URL

### Example Dashboard JSON

```json
{
  "dashboard": {
    "title": "Infamous Freight Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(errors_total[1m])"
          }
        ]
      },
      {
        "title": "Database Query Duration",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

## Testing Observability

**File: `api/src/routes/__tests__/observability.test.js`**

```javascript
describe('Observability', () => {
  it('should emit metrics on request', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);

    // Verify metrics were recorded
    const metrics = await fetch('http://localhost:4000/metrics').then(r =>
      r.text()
    );
    expect(metrics).toContain('http_requests_total');
  });

  it('should trace database queries', async () => {
    await request(app)
      .get('/api/shipments')
      .set('Authorization', `Bearer ${token}`);

    // Check traces in Jaeger UI at http://localhost:6831
    // Should see shipment.findMany span
  });

  it('should alert on error rate spike', async () => {
    // Simulate 100 errors
    for (let i = 0; i < 100; i++) {
      await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send({}); // Invalid request
    }

    // Wait for alert evaluation
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Should trigger HighErrorRate alert
  });
});
```

## Docker Compose for Observability Stack

**File: `docker-compose.observability.yml`**

```yaml
version: '3.8'

services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - '6831:6831/udp'
      - '16686:16686'
    environment:
      COLLECTOR_ZIPKIN_HOST_PORT: ':9411'

  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/prometheus-alerts.yml:/etc/prometheus/alerts.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3000:3000'
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_USERS_ALLOW_SIGN_UP: 'false'
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - '9093:9093'
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

## Best Practices

1. **Trace sampling** - Don't trace 100% of requests in production (overhead)
2. **Metric cardinality** - Avoid high-cardinality labels (user IDs, etc.)
3. **Alert fatigue** - Set thresholds carefully to avoid false positives
4. **Log aggregation** - Centralize logs for correlation with metrics/traces
5. **Retention policies** - Keep metrics/traces for reasonable periods (30-90 days)
6. **Performance impact** - Monitor observability tools themselves for overhead
7. **Data privacy** - Be careful not to log sensitive data (tokens, passwords)

