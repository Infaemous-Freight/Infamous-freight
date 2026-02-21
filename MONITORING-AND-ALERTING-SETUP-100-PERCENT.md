# Monitoring & Alerting Setup Guide

**Status**: ✅ READY FOR IMPLEMENTATION  
**Date**: February 19, 2026  
**Purpose**: Production visibility and incident prevention

---

## 1. Monitoring Architecture

```
Applications → Metrics Collectors → Time-Series Database → Dashboards
                                                        → Alerts
                                                        → Notifications
```

### Current Stack

| Component | Tool | Cost | Status |
|-----------|------|------|--------|
| Application Metrics | Datadog | $15/host | ✅ Configured |
| Error Tracking | Sentry | Free (10K/month) | ✅ Configured |
| Deployments | GitHub Actions | Free | ✅ Active |
| Health Checks | Custom Script | Free | ✅ Running |
| Uptime | Fly.io | Free | ✅ Built-in |

---

## 2. Metrics to Monitor

### Application-Level Metrics

```javascript
// Request latency
histogram: response_time_ms (P50, P95, P99)

// Request volume
counter: requests_total (by endpoint, method, status)

// Error rate
counter: errors_total (by status code, type)

// Resource usage
gauge: memory_usage_mb
gauge: cpu_usage_percent

// Business metrics
counter: active_users
counter: shipments_processed
counter: api_calls
```

### Infrastructure Metrics

```
CPU usage: < 75% (threshold for alert)
Memory: < 80% (threshold for alert)
Disk: < 90% (threshold for alert)
Network throughput: Baseline + 2x spike tolerance
Database queries: P99 < 1 second
Connection pool: < 80% of max
```

---

## 3. Setting Up Datadog (Primary Monitoring)

### Step 1: Add Datadog Agent to Application

```javascript
// apps/api/src/middleware/datadog.js
const tracer = require('dd-trace').init({
  hostname: process.env.DD_AGENT_HOST || 'localhost',
  port: process.env.DD_TRACE_AGENT_PORT || 8126,
});

// Enable automatic instrumentation
require('dd-trace').default_tracer.use();

module.exports = tracer;
```

### Step 2: Configure Environment Variables

```bash
# .env
DD_AGENT_HOST=localhost
DD_TRACE_AGENT_PORT=8126
DD_SERVICE=infamous-freight-api
DD_ENV=production
DD_TRACE_SAMPLING_RULES='[{"sample_rate":0.1}]'  # Sample 10%
```

### Step 3: Send Custom Metrics

```javascript
// Track custom business metrics
const StatsD = require('node-dogstatsd').StatsD;
const dogstatsd = new StatsD();

// Usage
dogstatsd.gauge('shipments.active', 42);
dogstatsd.increment('api.calls', 1);
dogstatsd.histogram('response.time', responseTime);
```

### Step 4: Setup Dashboard

**Visit**: https://app.datadoghq.com/

**Create Dashboard**:
1. New Dashboard → Timeboard
2. Add widgets:
   - Request latency over time
   - Error rate
   - CPU usage
   - Memory usage
   - Request volume

---

## 4. Setting Up Sentry (Error Tracking)

### Current Configuration

Already done! Sentry is configured in:
- Backend: `apps/api/src/middleware/errorHandler.js`
- Frontend: `apps/web/pages/_app.tsx`

### Verify Configuration

```bash
# Send test error
curl -X GET https://infamous-freight-api.fly.dev/api/test-error

# Check Sentry dashboard
# Navigate to: https://sentry.io/organizations/infamous-freight/
```

### Setup Alert Rules

1. Click Issues → Alerts
2. New Alert Rule:
   - **Name**: "High Error Rate"
   - **Condition**: Error rate > 5% in 5 min
   - **Action**: Send to Slack #alerts

3. Create more alerts:
   - **Critical Error**: Certain error types (SecurityError, DatabaseError)
   - **Performance**: Response time > 5 seconds
   - **Version**: New error appearing in new deployment

---

## 5. GitHub Actions Monitoring

**View all workflows**:
https://github.com/MrMiless44/Infamous-freight/actions

**Failing workflows alert automatically** to:
- GitHub: Red badge on repo
- Slack: #deployments channel (if integrated)
- Email: Repository admin

---

## 6. Health Check Monitoring

### Continuous Monitoring Script

```bash
# Run health check every 30 seconds
watch -n 30 './scripts/health-check.sh'
```

### Setup Automated Monitoring

**GitHub Action** (already deployed):
```yaml
# .github/workflows/auto-health-monitoring.yml
# Runs every 30 minutes
# Collects metrics
# Generates health score
# Alerts on issues
```

---

## 7. Alert Configuration

### Alert Severities

| Severity | Response Time | Example |
|----------|---------------|---------|
| CRITICAL | < 5 min | Total service down |
| HIGH | < 15 min | Error rate > 1% |
| MEDIUM | < 1 hour | Latency spike > 2x |
| LOW | < 4 hours | Minor issues |

### Alert Channels

```
Critical → Phone call + Slack + Email
High → Slack + Email
Medium → Slack only
Low → Email only
```

### Setting Up Slack Alerts

**For Sentry**:
1. Sentry → Settings → Integrations → Slack
2. Click "Add Integration"
3. Select channels for different alert types

**For Datadog**:
1. Datadog → Integrations → Slack
2. Create monitors
3. Notify @slack-incidents

---

## 8. Dashboard URLs

### Public Status Page

```
https://status.infamous-freight.com/
(If configured - shows uptime to customers)
```

### Internal Dashboards

```
GitHub Actions: https://github.com/MrMiless44/Infamous-freight/actions
Datadog: https://app.datadoghq.com/dashboard/
Sentry: https://sentry.io/organizations/infamous-freight/
Fly.io: https://fly.io/dashboard
Vercel: https://vercel.com/dashboard
```

---

## 9. Runbook for Common Issues

### Alert: High Error Rate

```
1. Check Sentry dashboard
2. What errors are occurring?
3. When did they start?
4. Which endpoints affected?
5. Check recent deployments (git log)
6. Rollback if new deploy caused it
```

### Alert: High Latency

```
1. Check database query times
2. Check external API response times
3. Check server resource usage (CPU, memory)
4. Scale if needed
5. Check for unusual traffic spike
```

### Alert: Memory Increasing

```
1. Check memory trend (is it growing continuously?)
2. If yes → Likely memory leak
3. Check for new deployments
4. Consider restart if reaching limit
5. File alert for investigation
```

### Alert: Failed Deployment

```
1. Check workflow logs
2. What is the error?
3. Local reproduction
4. Fix code
5. Re-push to trigger deployment
```

---

## 10. Maintenance Tasks

### Daily (Automated)

- Health check script runs every 30 min
- Sentry error aggregation
- Datadog metrics collection

### Weekly

- Review dashboard for anomalies
- Check alert accuracy (false positives?)
- Verify backup alerting works

### Monthly

- Alert rule review
- Dashboard optimization
- New metric evaluation

### Quarterly

- Monitoring strategy review
- Tools evaluation
- SLA review vs. actual

---

## 11. Cost Optimization

### Current Costs

```
Datadog: $500-1000/month (varies by usage)
Sentry: $0 (free tier: 10K events/month)
GitHub Actions: $0 (included, 2000 min/month)
Total: ~$500-1000/month
```

### Optimization Strategies

```
1. Reduce Datadog sampling rate
   - Currently sampling 10% of requests
   - Could reduce to 5% for non-critical endpoints

2. Archive old data to cheaper storage
   - Datadog: Archive to S3 after 30 days

3. Use synthetic monitoring selectively
   - Only for critical endpoints
   - Reduce number of synthetic checks

4. Consolidate tools
   - Evaluate if can reduce from 4 tools to 3
```

---

## 12. Setup Checklist

Before going to production:

- [ ] Datadog agent installed & configured
- [ ] Sentry connected & alerts created
- [ ] Health check script running
- [ ] GitHub Actions workflows active
- [ ] Dashboards created & accessible
- [ ] Alert channels configured (Slack, Email)
- [ ] Team trained on reading dashboards
- [ ] Runbooks created for common issues
- [ ] Monthly reviews scheduled
- [ ] On-call has access to all dashboards

---

## 13. Metrics to Calculate Health Score

**Health Score Formula** (0-100):

```
Score = (Uptime × 0.4) + (ErrorRate × 0.3) + (Latency × 0.2) + (Freshness × 0.1)

Where:
- Uptime: 99.9% = 100, 99% = 50, < 95% = 0
- ErrorRate: 1% = 100, 5% = 50, > 10% = 0
- Latency: P99 < 100ms = 100, > 1000ms = 0
- Freshness: Deployed today = 100, > 1 month = 0
```

### Health Score Ranges

```
90-100: Excellent - Everything working great
70-89:  Good - Operating normally
50-69:  Fair - Some issues, monitor closely
30-49:  Poor - Multiple issues, investigate
0-29:   Critical - Immediate action required
```

---

**Remember**: Monitoring is not about metrics, it's about **visibility into production**.

Good monitoring:
- Detects problems before users notice
- Provides context for faster debugging
- Shows trends over time
- Helps with capacity planning
- Verifies fixes actually worked

For incidents, see: [INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md](INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md)

**Last Updated**: February 19, 2026
