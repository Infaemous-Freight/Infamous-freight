# Production Monitoring & Observability Guide

_Phase 19: Post-Deployment Enhancements_

## 📊 Overview

Infamous Freight implements comprehensive production monitoring using:

- **Datadog RUM** - Real User Monitoring for frontend performance
- **Datadog APM** - Application Performance Monitoring for backend
- **Prometheus Metrics** - Marketplace queue and worker metrics
- **Sentry** - Error tracking and alerting
- **Bull Board** - Queue operations dashboard

## 🎯 Quick Access

| Service             | URL                                   | Purpose                            | Authentication          |
| ------------------- | ------------------------------------- | ---------------------------------- | ----------------------- |
| Metrics Dashboard   | `/api/marketplace/dashboard`          | Queue success rates, worker status | Admin scope required    |
| Prometheus Endpoint | `/api/marketplace/metrics/prometheus` | Prometheus scrape target           | Public (for Prometheus) |
| Bull Board          | `/ops/queues`                         | Queue operations UI                | Admin access            |
| API Health          | `/api/health`                         | API liveness check                 | Public                  |
| Datadog Dashboard   | https://app.datadoghq.com             | Full observability                 | Datadog login           |
| Sentry Dashboard    | https://sentry.io                     | Error tracking                     | Sentry login            |

## 🔧 Configuration

### Environment Variables

**Production (.env.production.template):**

```bash
# Datadog RUM (Frontend)
NEXT_PUBLIC_DD_APP_ID=your_app_id_here
NEXT_PUBLIC_DD_CLIENT_TOKEN=your_client_token_here
NEXT_PUBLIC_DD_SITE=datadoghq.com
NEXT_PUBLIC_DD_SERVICE=infamous-freight-web
NEXT_PUBLIC_DD_ENV=production

# Datadog APM (Backend)
DD_API_KEY=your_datadog_api_key_here
DD_TRACE_ENABLED=true
DD_SERVICE=infamous-freight-api
DD_ENV=production
DD_RUNTIME_METRICS_ENABLED=true

# Sentry
SENTRY_DSN=https://your_key@sentry.io/your_project
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_ENVIRONMENT=production

# Metrics Service
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PATH=/metrics
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=1.0
```

### Kubernetes Configuration

**HPA (Horizontal Pod Autoscaler):**

```yaml
minReplicas: 2
maxReplicas: 20
metrics:
  - cpu: 70%
  - memory: 80%
```

**Deployment:**

- Initial replicas: 2
- CPU request: 500m, limit: 2000m
- Memory request: 1Gi, limit: 4Gi
- Health checks: 30s interval, 5s timeout, 3 retries

## 📈 Marketplace Metrics

### Metrics Collection

The metrics service collects data every 30 seconds from Redis BullMQ queues:

**Queue Metrics:**

- `processed` - Total jobs completed successfully
- `failed` - Total jobs that failed
- `active` - Currently processing
- `waiting` - Queued for processing
- `avgDuration` - Average completion time (ms)

**Worker Metrics:**

- `active` - Workers currently processing
- `idle` - Workers waiting for jobs
- `errors` - Worker-level errors

**System Metrics:**

- `uptime` - Process uptime (seconds)
- `memory` - Heap used/total, RSS
- `cpu` - CPU usage percentage

### API Endpoints

**1. Dashboard Summary (JSON)**

```bash
GET /api/marketplace/dashboard
Authorization: Bearer <admin-token>
```

Response:

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalProcessed": 12345,
      "totalFailed": 123,
      "totalActive": 5,
      "totalWaiting": 10,
      "successRate": "99.01%"
    },
    "queues": {
      "dispatch": {
        "processed": 8000,
        "failed": 80,
        "active": 3,
        "waiting": 5,
        "avgDuration": 1234,
        "successRate": "99.00%"
      },
      "eta": {
        /* ... */
      },
      "expiry": {
        /* ... */
      }
    },
    "workers": {
      "dispatch": { "active": 45, "idle": 5, "errors": 2 },
      "eta": { "active": 8, "idle": 2, "errors": 0 },
      "expiry": { "active": 18, "idle": 2, "errors": 1 }
    },
    "system": {
      "uptime": 86400,
      "memory": { "heapUsed": 512, "heapTotal": 1024, "rss": 768 },
      "cpu": 45.2
    },
    "timestamp": "2026-01-16T16:45:00.000Z"
  }
}
```

**2. Prometheus Metrics (Text)**

```bash
GET /api/marketplace/metrics/prometheus
```

Response (Prometheus format):

```
# HELP infamous_queue_processed_total Total number of processed jobs
# TYPE infamous_queue_processed_total counter
infamous_queue_processed_total{queue="dispatch"} 8000 1737046800000

# HELP infamous_queue_failed_total Total number of failed jobs
# TYPE infamous_queue_failed_total counter
infamous_queue_failed_total{queue="dispatch"} 80 1737046800000

# HELP infamous_worker_active Number of active workers
# TYPE infamous_worker_active gauge
infamous_worker_active{worker="dispatch"} 45 1737046800000

# ... additional metrics ...
```

**3. Raw Metrics (JSON)**

```bash
GET /api/marketplace/metrics
Authorization: Bearer <admin-token>
```

**4. Health Check**

```bash
GET /api/marketplace/health
```

Response:

```json
{
  "status": "ok",
  "enabled": true,
  "timestamp": "2026-01-16T16:45:00.000Z"
}
```

## 🚨 Alerting

### Recommended Alert Thresholds

**Queue Health:**

- 🔴 CRITICAL: Success rate < 95% for 15 minutes
- 🟠 WARNING: Success rate < 98% for 15 minutes
- 🟠 WARNING: Waiting queue > 100 jobs for 10 minutes
- 🔴 CRITICAL: Waiting queue > 500 jobs for 5 minutes

**Worker Health:**

- 🟠 WARNING: Worker errors > 10 per hour
- 🔴 CRITICAL: All workers idle with waiting jobs > 0

**System Health:**

- 🟠 WARNING: Memory usage > 3GB
- 🔴 CRITICAL: Memory usage > 3.5GB
- 🟠 WARNING: CPU usage > 80% for 5 minutes
- 🔴 CRITICAL: CPU usage > 90% for 10 minutes

**Application:**

- 🔴 CRITICAL: API health check fails 3 times
- 🔴 CRITICAL: Error rate > 5% for 5 minutes
- 🟠 WARNING: Response time P95 > 2000ms

### Prometheus Alerting Rules

Create `k8s/prometheus-alerts.yaml`:

```yaml
groups:
  - name: infamous-freight-alerts
    interval: 30s
    rules:
      - alert: HighQueueFailureRate
        expr: |
          (infamous_queue_failed_total / (infamous_queue_processed_total + infamous_queue_failed_total)) > 0.05
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "High queue failure rate detected"
          description: "Queue {{ $labels.queue }} has failure rate above 5%"

      - alert: QueueBacklog
        expr: infamous_queue_waiting > 100
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Queue backlog building up"
          description: "Queue {{ $labels.queue }} has {{ $value }} waiting jobs"

      - alert: HighMemoryUsage
        expr: infamous_memory_heap_used_bytes > 3221225472 # 3GB
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "API memory usage is {{ $value | humanize }}B"
```

### Datadog Monitors

**RUM Monitors:**

1. **Page Load Time**: Alert when P95 > 3 seconds for 10 minutes
2. **Error Rate**: Alert when error rate > 2% for 5 minutes
3. **Session Count**: Alert when sessions drop > 50% (outage detection)

**APM Monitors:**

1. **API Latency**: Alert when P95 > 2 seconds for 10 minutes
2. **Error Rate**: Alert when error rate > 5% for 5 minutes
3. **Throughput**: Alert when requests/min drops > 75% (outage)

**Infrastructure Monitors:**

1. **Pod Restarts**: Alert when pod restarts > 3 in 10 minutes
2. **CPU Usage**: Alert when CPU > 80% for 15 minutes
3. **Memory Usage**: Alert when memory > 85% for 15 minutes

### Sentry Alerts

**Error Tracking:**

1. **New Error**: Immediate notification for new error types
2. **Error Spike**: Alert when error count increases > 100% in 1 hour
3. **Regression**: Alert when resolved error reappears

**Configuration** (Sentry Dashboard):

- Set up Slack/PagerDuty integration
- Configure alert rules for each project (API, Web, Mobile)
- Set appropriate thresholds based on traffic

### Sentry Test Events & Troubleshooting

**Quick client-side test**

Add a deliberate client error to confirm the pipeline:

```ts
myUndefinedFunction();
```

Expected:

- Browser console shows `Uncaught ReferenceError: myUndefinedFunction is not defined`
- Sentry event appears within ~5–20 seconds with a stack trace pointing at the source

**Recommended smoke test (no crash)**

Use a controlled capture in the browser:

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.captureException(new Error("Infamous Freight test error"));
```

**If events do not appear**

1. **Client config missing**: confirm `apps/web/src/lib/sentry.client.config.ts` exists and that `apps/web/pages/_app.tsx` imports and initializes Sentry via `initSentry()`.
2. **Public DSN missing**: ensure `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel and matches the project.
3. **Tunnel route blocked**: if using a tunnel (for example `/monitoring`), ensure middleware excludes it:

   ```ts
   export const config = {
     matcher: ["/((?!monitoring).*)"],
   };
   ```

4. **Server-only errors**: if the error is thrown in a server route, also configure `sentry.server.config.ts`.

## 📊 Dashboards

### Grafana Dashboard (Prometheus)

Create `grafana-dashboard.json` with panels:

**Overview Row:**

- Total Processed (counter)
- Success Rate (percentage)
- Active Workers (gauge)
- Waiting Jobs (gauge)

**Queue Performance Row:**

- Jobs Processed per Minute (rate)
- Average Duration (histogram)
- Failure Rate (percentage)
- Queue Backlog (area chart)

**System Health Row:**

- CPU Usage (line chart)
- Memory Usage (line chart)
- API Response Time (histogram)
- Error Rate (line chart)

### Datadog Dashboard

**Frontend (RUM) Dashboard:**

- Page Load Time (P50, P75, P95)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- JavaScript Errors
- Session Replay Links

**Backend (APM) Dashboard:**

- Request Throughput
- Response Time (P50, P95, P99)
- Error Rate
- Database Query Performance
- Redis Operation Latency
- Top Endpoints by Latency

**Infrastructure Dashboard:**

- Pod Count & Status
- CPU Usage per Pod
- Memory Usage per Pod
- Network I/O
- Disk I/O
- Container Restarts

## 🔍 Troubleshooting

### High Queue Failure Rate

**Symptoms:**

- Success rate < 98%
- Increased failed jobs in metrics

**Investigation:**

1. Check Bull Board for error details: `/ops/queues`
2. Review Sentry for error patterns
3. Check Datadog APM for slow external API calls
4. Review worker logs: `kubectl logs -l app=infamous-freight-api`

**Common Causes:**

- External API timeout (AI services, geocoding)
- Database connection pool exhaustion
- Redis connection issues
- Invalid job data

**Resolution:**

- Increase retry attempts in job options
- Scale up worker concurrency if jobs timing out
- Fix data validation issues
- Check external service status

### Queue Backlog Building Up

**Symptoms:**

- Waiting jobs > 100
- Active workers < max concurrency
- Slow job processing

**Investigation:**

1. Check worker utilization: `GET /api/marketplace/dashboard`
2. Review CPU/memory usage in Datadog
3. Check for blocked jobs in Bull Board
4. Review Datadog APM traces for slow operations

**Common Causes:**

- Worker concurrency too low
- Slow external API calls
- Database query performance issues
- Memory leak causing slowdowns

**Resolution:**

- Scale worker concurrency: `WORKER_CONCURRENCY_DISPATCH=100`
- Add database indexes for slow queries
- Implement caching for repeated API calls
- Restart pods if memory leak suspected

### High Memory Usage

**Symptoms:**

- Memory > 3GB
- Frequent pod restarts (OOMKilled)
- Slow response times

**Investigation:**

1. Check metrics: `GET /api/marketplace/metrics`
2. Review memory usage in Datadog: `infamous_memory_rss_bytes`
3. Analyze heap dump if available
4. Check for memory leaks with Chrome DevTools

**Common Causes:**

- Job data accumulation in memory
- Large file processing (voice uploads)
- Unclosed database connections
- Event emitter memory leaks

**Resolution:**

- Implement pagination for large queries
- Stream large file processing
- Add proper connection cleanup
- Review event listener cleanup in workers
- Scale up memory limits: `memory.limit=6Gi`

### API Response Time Degradation

**Symptoms:**

- P95 > 2 seconds
- Slow page loads in RUM
- Timeout errors

**Investigation:**

1. Check Datadog APM traces for slow operations
2. Review database query performance
3. Check Redis latency
4. Review external API call durations

**Common Causes:**

- Missing database indexes
- N+1 query problems
- Large payload responses
- Slow external API calls

**Resolution:**

- Add database indexes
- Implement query result caching
- Use pagination for large datasets
- Implement request/response compression
- Consider GraphQL for flexible queries

## 🎯 Performance Targets

### Frontend (Web Vitals)

- ✅ LCP (Largest Contentful Paint): < 2.5s
- ✅ FID (First Input Delay): < 100ms
- ✅ CLS (Cumulative Layout Shift): < 0.1
- ✅ TTFB (Time to First Byte): < 600ms

### Backend (API)

- ✅ P50 Response Time: < 200ms
- ✅ P95 Response Time: < 1000ms
- ✅ P99 Response Time: < 2000ms
- ✅ Uptime: > 99.9%
- ✅ Error Rate: < 1%

### Marketplace (Queues)

- ✅ Success Rate: > 99%
- ✅ Job Processing Time: < 5 seconds
- ✅ Queue Backlog: < 50 jobs
- ✅ Worker Utilization: 60-80%

## 📚 Additional Resources

- [Datadog RUM Documentation](https://docs.datadoghq.com/real_user_monitoring/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Sentry Error Tracking](https://docs.sentry.io/platforms/)
- [Kubernetes HPA Guide](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Bull Board Documentation](https://github.com/felixmosh/bull-board)

## 🔒 Security Considerations

- Metrics endpoints require admin scope (except Prometheus endpoint)
- Sanitize error messages to remove PII before sending to Sentry
- Use Datadog privacy level `mask-user-input` for session replays
- Store Datadog/Sentry credentials in Kubernetes secrets
- Rotate API keys quarterly
- Review dashboard access permissions regularly
