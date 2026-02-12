# Incident Response Playbook

**Last Updated**: January 22, 2026  
**Owner**: On-Call Engineer  
**Status**: Active (Use during production incidents)

---

## Incident Response Summary (Internal - 1 Page)

**Trigger**: Security incident, outage, or data exposure.

**Response SLA**

- **Acknowledge**: ≤ 24 hours
- **Contain**: ≤ 48 hours
- **Notify customers (if required)**: ≤ 72 hours

**Owners (in order)**

- CTO → Security Lead → Customer Success

---

## Quick Reference: When Things Break

```
💥 Something's Wrong?
├─ Step 1: Check status page (alive?)
├─ Step 2: Page on-call team (Slack #alerts)
├─ Step 3: Run "triage" checklist below
├─ Step 4: Follow specific scenario
└─ Step 5: Document & communicate

⏱️ Timeline:
├─ Minutes 0-5: Acknowledge (get responders online)
├─ Minutes 5-15: Triage (identify root cause)
├─ Minutes 15-45: Mitigate (fix or rollback)
└─ Minutes 45-60: Verify (confirm recovery)
```

---

## Incident Triage (Do This First!)

```bash
# 1. Check if it's really down
curl -s https://api.yourdomain.com/api/health | jq .
# Expected: {"status":"ok","database":"connected"}

# 2. Check error rate
kubectl logs deployment/api --tail=100 | grep -i error | wc -l

# 3. Check if database is up
kubectl exec -it deployment/api -- psql $DATABASE_URL -c "SELECT 1;"

# 4. Check pod health
kubectl get pods -l app=api
# All should be Running, not CrashLoopBackOff

# 5. Check recent errors
kubectl logs deployment/api --tail=50 --timestamps=true
```

---

## Severity Levels

### 🔴 CRITICAL (Page Everyone)

- **Error rate** > 1% for 2+ minutes
- **API completely down** (no responses)
- **Database disconnected**
- **Data loss or corruption**
- **Security breach**

**Action**: Declare SEV-1, page ops team, consider rollback

### 🟠 HIGH (Page On-Call)

- **Error rate** 0.1-1% for 5+ minutes
- **Latency P95 > 2000ms** for 5+ minutes
- **Partial outage** (some endpoints down)
- **Memory/CPU critically high** (> 90%)

**Action**: Declare SEV-2, investigate root cause, coordinate fix

### 🟡 MEDIUM (Slack Alert)

- **Error rate** 0.01-0.1%
- **Latency elevated** (P95 200-500ms)
- **Non-critical feature degraded**
- **One pod repeatedly restarting**

**Action**: Log ticket, monitor, prioritize based on impact

### 🟢 LOW (Log Only)

- **Error rate** < 0.01%
- **Single request failures** (transient)
- **Expected warnings** (rate limit blocks)

**Action**: Review logs, file non-urgent ticket if pattern

---

## Common Scenarios & Fixes

### Scenario 1: High Error Rate Spike (> 0.5%)

**Symptoms**: Errors suddenly jump, customers report 500s  
**Duration**: Usually 5-30 minutes

**Step 1: Identify the error**

```bash
# Check what's failing
kubectl logs deployment/api --tail=100 | grep -i error | head -10

# Common patterns:
# - "ECONNREFUSED 5432" = Database down
# - "ERR_INVALID_ARG_VALUE" = Configuration error
# - "TimeoutError" = External service slow
# - "OOM" = Out of memory
```

**Step 2: Quick fixes by error type**

**If database connection error:**

```bash
# Restart API pods (they'll reconnect)
kubectl rollout restart deployment/api

# OR check database directly
kubectl exec -it deployment/api -- psql $DATABASE_URL -c "SELECT 1;"

# OR restart database
kubectl delete pod postgres-0  # If using StatefulSet
```

**If configuration error:**

```bash
# Check environment variables
kubectl exec -it pod/api -- env | grep JWT_SECRET

# Update ConfigMap/Secret if missing
kubectl edit configmap app-config
kubectl rollout restart deployment/api
```

**If external service timeout:**

```bash
# Check which service is slow
kubectl logs deployment/api | grep timeout

# Increase timeout in code or environment
kubectl set env deployment/api API_TIMEOUT=30000
kubectl rollout restart deployment/api
```

**If out of memory:**

```bash
# Check memory usage
kubectl top pods -l app=api

# Scale up (add replicas)
kubectl scale deployment/api --replicas=5

# OR increase memory limits in Kubernetes
kubectl set resources deployment/api --requests=memory=512Mi --limits=memory=1024Mi
kubectl rollout restart deployment/api
```

**Step 3: Verify recovery**

```bash
# Wait for pods to stabilize
kubectl rollout status deployment/api --timeout=5m

# Check error rate drops
kubectl logs deployment/api --tail=100 | grep -i error | wc -l

# Test health endpoint
curl -s https://api.yourdomain.com/api/health | jq .
```

**Step 4: Communicate**

```
Status: INVESTIGATING → MITIGATING → RESOLVED
Updates: Every 5-10 minutes until fixed
Final: Root cause + prevention plan
```

---

### Scenario 2: High Latency (P95 > 1000ms)

**Symptoms**: Requests slow, timeouts, customer complaints  
**Duration**: Usually 10-60 minutes

**Step 1: Identify slow queries**

```bash
# Check database slow query log
kubectl exec -it deployment/api -- psql $DATABASE_URL -c "
  SELECT query, calls, total_time, mean_time
  FROM pg_stat_statements
  ORDER BY mean_time DESC LIMIT 10;
"

# If slow queries found:
# - Add database index: CREATE INDEX idx_shipments_user ON shipments(user_id);
# - Optimize Prisma query: Use select() to fetch fewer fields
# - Consider caching: docs/MONITORING_OBSERVABILITY_SETUP.md
```

**Step 2: Check external services**

```bash
# Are Stripe/Anthropic/email service slow?
kubectl logs deployment/api | grep -i "stripe\|anthropic\|email" | grep duration

# If external service slow:
# - Increase timeout (temporary)
# - Add retry logic
# - Queue requests (don't wait for response)
```

**Step 3: Scale up if needed**

```bash
# Check current replicas
kubectl get deployment/api

# If CPU/memory high, scale up
kubectl scale deployment/api --replicas=5
kubectl rollout status deployment/api
```

**Step 4: Monitor recovery**

```bash
# Watch latency decrease
# Prometheus: histogram_quantile(0.95, http_request_duration_ms)

# Should drop from 1000+ms to < 500ms within 10 minutes
```

---

### Scenario 3: Pod Crash Loop

**Symptoms**: Pods repeatedly restart, status shows `CrashLoopBackOff`  
**Duration**: Until fixed

**Step 1: Check logs**

```bash
# See why pod is crashing
kubectl logs pod/api-xyz123 --previous  # Previous crashed attempt
kubectl logs pod/api-xyz123             # Current

# Look for:
# - "FATAL" errors in startup
# - Missing environment variables
# - Database migration failures
# - Out of memory
```

**Step 2: Common causes & fixes**

**If database migration failed:**

```bash
# Stop new deployments
kubectl rollout pause deployment/api

# Fix migration
cd apps/api && pnpm prisma migrate resolve --rolled-back "migration_name"

# Resume deployment
kubectl rollout resume deployment/api
```

**If missing environment variable:**

```bash
# Check what's set
kubectl exec -it pod/api-xyz123 -- env | head -20

# Add missing variable
kubectl set env deployment/api MY_VAR="value"
kubectl rollout restart deployment/api
```

**If out of memory:**

```bash
# Increase memory limit
kubectl set resources deployment/api --limits=memory=2Gi

# Scale to fewer replicas to reduce total memory
kubectl scale deployment/api --replicas=2
kubectl rollout restart deployment/api
```

**Step 3: Verify recovery**

```bash
# Watch pods stabilize
kubectl get pods -l app=api -w

# All should reach "Running" status
# If still crashing after 5 attempts, rollback:
kubectl rollout undo deployment/api
```

---

### Scenario 4: Database Connection Limit Hit

**Symptoms**: Errors like "too many connections", new requests timeout  
**Duration**: Minutes to hours

**Step 1: Check connection count**

```bash
# How many connections are open?
kubectl exec -it deployment/api -- psql $DATABASE_URL -c "
  SELECT count(*) FROM pg_stat_activity;
"

# Expected: 5-15 connections
# Warning: 15-20 connections
# Critical: 20+ connections

# Who's hogging them?
kubectl exec -it deployment/api -- psql $DATABASE_URL -c "
  SELECT usename, state, count(*)
  FROM pg_stat_activity
  GROUP BY usename, state;
"
```

**Step 2: Fix**

**If idle connections:**

```bash
# Kill idle connections (don't kill active ones!)
kubectl exec -it deployment/api -- psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state='idle' AND query_start < now() - interval '5 min';
"

# Restart API to reset connection pool
kubectl rollout restart deployment/api
```

**If legitimate load:**

```bash
# Increase database connection limit
# In RDS/DigitalOcean admin panel:
# max_connections parameter → increase to 200

# Increase API connection pool
kubectl set env deployment/api DB_POOL_MAX=20
kubectl rollout restart deployment/api

# OR scale API to fewer replicas (fewer connections needed)
kubectl scale deployment/api --replicas=2
```

---

### Scenario 5: Disk Space Low

**Symptoms**: Database write failures, pod evictions  
**Duration**: Hours before critical

**Step 1: Check disk usage**

```bash
# How much space is left?
kubectl exec -it deployment/postgres -- df -h

# If < 10% remaining: CRITICAL
# If < 20% remaining: WARNING
# If < 50% remaining: MONITOR

# What's using space?
du -sh /var/lib/postgresql/data/*
```

**Step 2: Free up space**

**If logs are huge:**

```bash
# Clear old log files
kubectl exec -it deployment/api -- rm -rf /var/log/app/old-*.log

# Reduce log verbosity (temporarily)
kubectl set env deployment/api LOG_LEVEL=warn
```

**If database is huge:**

```bash
# Archive/delete old data (be careful!)
kubectl exec -it deployment/postgres -- psql -c "
  DELETE FROM audit_logs WHERE created_at < now() - interval '90 days';
  VACUUM;
"

# OR increase disk size (RDS/DigitalOcean admin panel)
```

---

### Scenario 6: Memory Leak (Slowly Growing Memory)

**Symptoms**: Memory usage increases over hours, eventually OOM  
**Duration**: 24-48 hours until critical

**Step 1: Monitor memory trend**

```bash
# Watch memory over time
kubectl top pods -l app=api --containers=true

# Get historical data from Prometheus
# Query: container_memory_usage_bytes{pod=~"api.*"}
# Graph it in Grafana
```

**Step 2: Find the leak**

```bash
# Enable memory profiling (requires code changes)
# See: apps/api/src/middleware/logger.js for instrumentation

# Check for:
# - Unbounded cache (rate limit metrics, response cache)
# - Growing arrays (accumulated over time)
# - Unclosed connections (database, HTTP)
```

**Step 3: Temporary fix**

```bash
# Restart pods daily (forces cleanup)
# Add CronJob to Kubernetes:

apiVersion: batch/v1
kind: CronJob
metadata:
  name: api-restart-daily
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: api
          containers:
          - name: kubectl
            image: bitnami/kubectl
            command:
            - /bin/sh
            - -c
            - kubectl rollout restart deployment/api
```

**Step 4: Find & fix the leak**

```bash
# This is a code issue, requires debugging
# Check git log for recent changes
git log --oneline apps/api/src -10

# Review recent commits for:
# - new caches added
# - event listeners not removed
# - database queries in loops
```

---

## Rollback Decision Matrix

| Error Rate | Duration | Action                           |
| ---------- | -------- | -------------------------------- |
| > 1%       | > 2 min  | **ROLLBACK NOW**                 |
| > 0.5%     | > 5 min  | Rollback if fix > 10 min         |
| > 0.1%     | > 30 min | Investigate, fix, OR rollback    |
| < 0.1%     | Any      | Continue monitoring, no rollback |

### How to Rollback

```bash
# 1. Immediate: Revert to previous version
kubectl rollout undo deployment/api
kubectl rollout status deployment/api

# 2. If that doesn't work: Manual rollback
kubectl set image deployment/api api=infamous-freight-api:PREVIOUS_VERSION
kubectl rollout status deployment/api

# 3. Verify it's working
curl -s https://api.yourdomain.com/api/health
kubectl logs deployment/api --tail=50

# 4. Communicate rollback to team
# "Rolled back due to [reason]. Previous version restored. Investigating."

# 5. Post-mortem (within 24 hours)
# - What went wrong?
# - Why wasn't it caught in testing?
# - How do we prevent this?
```

---

## Post-Incident: Lessons Learned

**Every incident requires a retrospective within 24 hours:**

```markdown
# Incident Report: [Date] [Time Duration]

## Timeline

- 15:23 UTC: Issue detected (error spike to 1.2%)
- 15:25 UTC: Root cause identified (slow database query)
- 15:28 UTC: Fix deployed (database index added)
- 15:30 UTC: Recovery confirmed (errors drop to 0.01%)
- **Total downtime: 7 minutes**

## Impact

- Users affected: ~500
- Requests failed: ~150
- Revenue lost: $X (if applicable)

## Root Cause

`[Detailed explanation]`

## Why Wasn't It Caught?

- [ ] No test coverage for this scenario
- [ ] Monitoring didn't catch it
- [ ] Slow degradation (not immediate failure)
- [ ] External service change
- [ ] Other: _____

## Prevention

- [ ] Add test case for this scenario
- [ ] Update monitoring/alert threshold
- [ ] Code optimization
- [ ] Add documentation
- [ ] Runbook update
- [ ] Team training

## Action Items

- [ ] John: Write test case (by tomorrow)
- [ ] Jane: Add Prometheus alert (by tomorrow)
- [ ] Bob: Optimize database query (this week)
- [ ] Team: Review in next sync (Friday)

**Signed**: [Incident Commander]
```

---

## Escalation Path

```
Customer → 5xx Error
    ↓
Monitoring Alert (P95 > 1000ms, error rate > 0.1%)
    ↓
Slack #alerts notification
    ↓
On-Call Engineer pages in (Slack → PagerDuty)
    ↓
If not fixed in 15 min → Page Team Lead
    ↓
If not fixed in 30 min → Page Director
    ↓
If still broken → All-hands standup + war room
```

---

## On-Call Responsibilities

**Before Going On-Call**

- [ ] Read this playbook
- [ ] Know how to kubectl
- [ ] Have VPN access
- [ ] Update your phone number in PagerDuty
- [ ] Test that you can SSH to servers

**During On-Call**

- [ ] Respond to pages within 5 minutes
- [ ] Keep team informed (Slack updates every 5-10 min)
- [ ] Document actions taken (for post-mortem)
- [ ] Don't hesitate to escalate
- [ ] Have hand-off meeting with next on-call

**After On-Call**

- [ ] Complete incident reports
- [ ] Update runbooks if needed
- [ ] Share learnings with team
- [ ] Thank your replacement!

---

## Emergency Contacts

| Role           | Name   | Phone   | Slack    |
| -------------- | ------ | ------- | -------- |
| VP Engineering | [Name] | [Phone] | @[slack] |
| DevOps Lead    | [Name] | [Phone] | @[slack] |
| Database Admin | [Name] | [Phone] | @[slack] |
| Security Lead  | [Name] | [Phone] | @[slack] |

---

## Resources

- Runbook: docs/DEPLOYMENT_RUNBOOK_KUBERNETES.md
- Status Page: <https://status.yourdomain.com>
- Monitoring: <https://grafana.yourdomain.com>
- Logs: kubectl logs deployment/api
- Database: PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD psql $DATABASE_URL

---

**Last Updated**: 2026-01-22  
**Next Review**: 2026-02-22 (1 month after launch)  
**Status**: ACTIVE - Use during incidents
