# Fly.io Monitoring & Alerting Guide

## Built-in Metrics

Fly.io automatically collects metrics for your app. View them at:
<https://fly.io/apps/infamous-freight-apps/api/metrics>

### Key Metrics to Monitor

1. **Response Time (P95)** - Should be < 200ms
2. **Error Rate** - Should be < 1%
3. **Memory Usage** - Should be < 80% of allocated
4. **CPU Usage** - Should be < 70% sustained
5. **Health Check Success Rate** - Should be 100%

## Custom Alerts

Set up alerts via Fly.io dashboard or CLI:

```bash
# Create alert for high error rate
flyctl monitor alerts create \
  --app infamous-freight-api \
  --metric http_response_status_5xx_count \
  --operator greater_than \
  --threshold 10 \
  --duration 5m \
  --notify email

# Create alert for high memory usage
flyctl monitor alerts create \
  --app infamous-freight-api \
  --metric vm_memory_percent \
  --operator greater_than \
  --threshold 80 \
  --duration 10m \
  --notify email

# Create alert for failed health checks
flyctl monitor alerts create \
  --app infamous-freight-api \
  --metric health_check_failing \
  --operator equals \
  --threshold 1 \
  --duration 2m \
  --notify email
```

## Prometheus Metrics Export

Your API exposes Prometheus metrics at `/metrics` (port 9091).

### Available Metrics

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `nodejs_heap_size_used_bytes` - Memory usage
- `process_cpu_seconds_total` - CPU time

### Query Examples

```promql
# Request rate (per minute)
rate(http_requests_total[1m])

# P95 response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

## Grafana Dashboard

Create a Grafana dashboard to visualize Fly.io metrics:

1. Add Prometheus data source: `https://infamous-freight-api.fly.dev:9091`
2. Import dashboard:
   [Fly.io Node.js Dashboard](https://grafana.com/grafana/dashboards/)
3. Configure alerts in Grafana

## Uptime Monitoring

Use external monitoring services:

### Option 1: UptimeRobot (Free)

```
Monitor URL: https://infamous-freight-api.fly.dev/api/health
Interval: 5 minutes
Alert contacts: your@email.com
```

### Option 2: Better Stack (formerly Logtail)

```bash
# Add to your app
npm install @logtail/node

# In server.ts
import { Logtail } from '@logtail/node';
const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
```

### Option 3: Sentry

```bash
# Already configured in your app
# Set SENTRY_DSN in Fly.io secrets
flyctl secrets set SENTRY_DSN="<your-dsn>" -a infamous-freight-api
```

## Log Monitoring

### View Logs in Real-Time

```bash
flyctl logs -a infamous-freight-api
```

### Search Logs

```bash
# Last 100 lines
flyctl logs -a infamous-freight-api --recent 100

# Filter by severity
flyctl logs -a infamous-freight-api | grep ERROR

# Follow specific instance
flyctl logs -a infamous-freight-api --instance <instance-id>
```

### Log Aggregation

Forward logs to external service:

```bash
# Add log shipper
flyctl monitor logs ship \
  --app infamous-freight-api \
  --destination https://your-log-service.com/endpoint
```

## Performance Monitoring

### Application Performance Monitoring (APM)

Consider adding:

1. **New Relic** - Full APM suite
2. **Datadog** - Infrastructure + APM
3. **Elastic APM** - Open source APM

### Example: New Relic Integration

```bash
# Install agent
pnpm add newrelic

# Add to server.ts (first line)
import 'newrelic';

# Set secrets
flyctl secrets set NEW_RELIC_LICENSE_KEY="<key>" -a infamous-freight-api
flyctl secrets set NEW_RELIC_APP_NAME="Infæmous Freight API" -a infamous-freight-api
```

## Cost Monitoring

Monitor your Fly.io costs:

```bash
# View current month costs
flyctl billing show

# View usage by app
flyctl billing usage -a infamous-freight-api
```

### Cost Optimization Tips

1. Use auto-stop/auto-start for non-production (already configured)
2. Right-size VMs based on actual usage
3. Use staging environment with smaller VMs (512MB)
4. Monitor idle time and adjust min_machines_running

## Incident Response

### Quick Commands

```bash
# Scale up during traffic spike
flyctl scale count 3 -a infamous-freight-api

# Increase memory if OOM errors
flyctl scale memory 2048 -a infamous-freight-api

# Rollback if issues
flyctl releases rollback -a infamous-freight-api

# Restart all instances
flyctl apps restart infamous-freight-api
```

### Debugging Checklist

- [ ] Check health endpoint:
      `curl https://infamous-freight-api.fly.dev/api/health`
- [ ] View logs: `flyctl logs -a infamous-freight-api`
- [ ] Check metrics: <https://fly.io/apps/infamous-freight-apps/api/metrics>
- [ ] Verify secrets: `flyctl secrets list -a infamous-freight-api`
- [ ] Test database:
      `flyctl ssh console -a infamous-freight-api -C "cd /app && npx prisma db pull"`
- [ ] Check recent deploys: `flyctl releases -a infamous-freight-api`

## Dashboard Recommendations

### Fly.io Dashboard

Monitor: <https://fly.io/apps/infamous-freight-api>

### Key Pages

- **Overview** - Status, instances, recent deploys
- **Metrics** - Performance graphs
- **Monitoring** - Health checks, alerts
- **Certificates** - SSL/TLS status
- **Networking** - IPs, routing

---

**Best Practice**: Set up at least one external uptime monitor and configure
email/Slack alerts for critical metrics.
