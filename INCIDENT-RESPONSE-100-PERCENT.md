# Incident Response Guide

This guide provides procedures for responding to production incidents at
Infamous Freight Enterprises. All incident responders should be familiar with
this document.

**Table of Contents**

1. [Incident Severity Levels](#incident-severity-levels)
2. [Immediate Response](#immediate-response)
3. [Communication Protocol](#communication-protocol)
4. [Common Incident Types](#common-incident-types)
5. [Triage & Investigation](#triage--investigation)
6. [Mitigation & Recovery](#mitigation--recovery)
7. [Post-Incident Review](#post-incident-review)

---

## Incident Severity Levels

```
CRITICAL (P1)
├─ Complete service outage (API/Web/Mobile all unavailable)
├─ Data loss or corruption affecting >1000 users
├─ Security breach with credential exposure
├─ Payment processing down (Stripe/PayPal)
└─ ETA to impact: <5 minutes

HIGH (P2)
├─ Partial service degradation (>50% of users affected)
├─ Performance degradation (P99 latency >10s)
├─ Database connection pool exhausted
├─ Memory leak causing pod restarts
└─ ETA to impact: 15-30 minutes if unresolved

MEDIUM (P3)
├─ Limited user impact (<10% affected)
├─ Elevated error rates (>5%)
├─ Slow specific features (>3s response)
├─ Non-critical service (reporting, exports) unavailable
└─ ETA to impact: 1-2 hours if unresolved

LOW (P4)
├─ Minor bugs or UI glitches
├─ Cosmetic issues
├─ One-off errors (not reproducible)
└─ No user impact observed
```

---

## Immediate Response

### **Step 1: Declare Incident (First 1 minute)**

⏱️ **Timeline**: Incident declared in Slack #incidents channel

```slack
🚨 **INCIDENT DECLARED**
Severity: [P1|P2|P3|P4]
System: [API|Web|Mobile|Database|Billing]
Symptom: [2-3 sentence description]
Starting Investigation: @on-call
Expected Impact: [X users / X% of traffic]
```

**Responsibility**: First responder (on-call, ops engineer, or senior dev)

### **Step 2: Page On-Call Lead (First 2 minutes)**

- **P1 Critical**: Page on-call engineer + tech lead + product manager
- **P2 High**: Page on-call engineer + tech lead
- **P3 Medium**: Notify in #incidents, wait for on-call to acknowledge
- **P4 Low**: Post in #incidents for triage next business day

### **Step 3: Start War Room (First 5 minutes)**

- **Slack**: Create thread in #incidents for coordination
- **Call**: Start video call if P1/P2 (link posted in Slack)
- **Document**: Google Doc with:
  - Discovery timeline
  - Investigation notes
  - Mitigation attempts
  - Resolution status

### **Step 4: Assess Scope (First 10 minutes)**

```
□ What is affected? (users, features, data)
□ How many users impacted? (count or %)
□ How critical are affected features?
□ Is it spreading/getting worse?
□ Can we serve traffic in degraded mode?
□ Do we need emergency maintenance window?
□ Should we notify customers?
```

---

## Communication Protocol

### **During Incident**

**Every 15 minutes** (if P1), **Every 30 minutes** (if P2):

- Post status update in Slack #incidents thread with: **Status | ETA | Action**
- Example: "Still investigating DB connection leak. ETA fix 15 min. Attempting
  pool reset."

**Frequency**: P1 = every 5-15 minutes, P2 = every 15-30 minutes, P3 = hourly

### **Customer Communication**

**Decide immediately**: Do customers need to know?

| Incident                | Notify  | Channel                    | Message                                                     |
| ----------------------- | ------- | -------------------------- | ----------------------------------------------------------- |
| API down                | YES     | Status page + email        | "We're experiencing API issues. Our team is investigating." |
| Payment processing down | YES     | Status page + urgent email | "Payment processing temporarily unavailable. Retry later."  |
| Data delay >1 hour      | Partial | Status page update         | "Reporting dashboard delayed. Working on fix."              |
| Minor bug               | NO      | Internal tracking          | "Report in #bugs, will fix in next sprint"                  |

**Status Page**: Update
[status.infamous-freight.com](https://status.infamous-freight.com)
(Statuspage.io)

### **Escalation Matrix**

```
Level 1: On-call engineer (first responder)
Level 2: Tech lead (if no progress in 10 min)
Level 3: CTO (if no resolution in 30 min)
Level 4: VP Eng + CEO (if outage >1 hour or data loss)
```

---

## Common Incident Types

### **1. API Service Down**

**Symptoms**:

- All API requests returning 503 Service Unavailable
- Health check endpoint `/api/health` is failing
- Pod logs show startup errors or crashes

**Investigation**:

```bash
# Check pod status
kubectl get pods -n infamous-freight-api

# Check recent logs
kubectl logs -n infamous-freight-api deployment/api --tail=50

# Check health
curl -v https://api.infamous-freight.com/api/health

# Check database connectivity
kubectl logs -n infamous-freight-api deployment/api | grep -i "database\|postgres"

# Check environment secrets
kubectl get secrets -n infamous-freight-api
```

**Mitigation**:

1. Check Sentry for stack traces (`Settings > Integrations`)
2. Review recent deployments (last 1 hour)
3. Rollback if < 30 minutes old: `kubectl rollout undo deployment/api`
4. If DB issue: Check Railway dashboard for connection issues
5. Restart pod if transient: `kubectl rollout restart deployment/api`

### **2. Database Connection Pool Exhausted**

**Symptoms**:

- Error: `too many connections` or `connections unavailable`
- P99 latency spikes, timeouts increase
- Specific endpoints become very slow

**Investigation**:

```bash
# Check Prisma connection pool status
SELECT count(*) FROM pg_stat_activity WHERE datname = 'infamous_freight';

# Check idle connections
SELECT * FROM pg_stat_activity
WHERE state = 'idle' AND query_start < NOW() - INTERVAL '10 minutes';

# Datadog: Monitor database.connections metric
```

**Mitigation**:

1. **Immediate**: Scale down non-critical services (reporting, exports)
2. **Short-term**: Increase pool size in env: `DATABASE_POOL_SIZE=40`
   (default 20)
3. **Investigation**: Find code path causing connection leak
   - Check logs for `query > 30s` (timeout not released)
   - Verify `.disconnect()` or `$disconnect()` called in error handlers
4. **Restart**: Redeploy API to reset connection pool:
   `kubectl rollout restart deployment/api`

**Prevention**: Set pool timeout to 5min, add connection cleanup job

### **3. High Memory Usage (Pod OOMKilled)**

**Symptoms**:

- Pod evicted: `OOMKilled` or `OutOfMemory`
- Memory usage climbing: 512MB → 2GB over hours
- Periodic restarts (pod restart loop)

**Investigation**:

```bash
# Check memory metrics
kubectl top pod -n infamous-freight-api deployment/api

# View OOM event
kubectl describe pod -n infamous-freight-api <pod-name> | grep -A5 OOMKilled

# Generate heap snapshot (if app still running)
curl http://pod-ip:3001/api/debug/heap-snapshot > heap.json
```

**Mitigation**:

1. **Immediate**: Scale up pod memory: `requests: 512Mi → 1Gi` in deployment
2. **Investigation**: Check for memory leaks
   - Logging too verbosely? (reduce log level)
   - Cache growing unbounded? (add TTL)
   - Streams not closing? (verify `res.end()` or `stream.destroy()`)
3. **Fix**: Deploy patch, redeploy
4. **Prevent**: Add memory alerts at 70% threshold

### **4. High Error Rate (5xx Errors)**

**Symptoms**:

- Dashboard shows 5xx rate >1%
- Sentry reports spike in errors
- Log analyzer shows error pattern

**Investigation**:

```bash
# Check error logs
kubectl logs deployment/api | grep -i "error\|exception" | tail -20

# Check Sentry for error patterns
# Group by message to find common root cause
# Ex: "Cannot read property 'id' of undefined" (null dereference)

# Check request rate vs error rate
# If errors are spike but no traffic spike → code bug
# If errors with traffic spike → scaling issue
```

**Mitigation**:

1. Identify root cause from Sentry stack trace
2. If code bug: temporary feature flag to disable feature
3. If scaling issue: scale horizontally (more pods)
4. Deploy fix once ready

### **5. Slow API Response Times**

**Symptoms**:

- P99 latency >5s (normally <500ms)
- Web app feels sluggish, requests timeout
- Specific endpoints affected or all endpoints?

**Investigation**:

```bash
# Look at request waterfall
Datadog > APM > Traces > Filter by slow traces (duration > 5s)

# Find bottleneck in chain:
# endpoint → middleware → database → external API

# Check if database query is slow
# Enable query logging:
# DATABASE_LOG_QUERIES=true

# Check if external API is slow (Stripe, etc.)
# Look for HTTP span duration in traces
```

**Mitigation**:

1. Optimize identified bottleneck:
   - Database: Add index, use pagination, add caching
   - External API: Add retry logic, fallback to cached data
   - Code: Profile function, reduce iterations
2. Add monitoring for this metric going forward
3. Deploy fix

### **6. Duplicate Shipment/Payment Issue**

**Symptoms**:

- Shipment created twice (same ID appears in DB)
- Payment charged twice (Stripe shows 2x transactions)
- User reporting: "I clicked once, got billed twice"

**Investigation**:

```sql
-- Find duplicate shipments
SELECT customer_id, COUNT(*) as count FROM shipments
GROUP BY customer_id HAVING count > 1
ORDER BY count DESC;

-- Check creation timestamps (if same second → likely race condition)
SELECT id, customer_id, created_at FROM shipments
WHERE created_at BETWEEN '2024-01-20 10:00:00' AND '2024-01-20 10:05:00'
ORDER BY created_at;

-- Check audit log for double-fire
SELECT * FROM audit_logs
WHERE action = 'CREATE' AND table_name = 'shipments'
AND created_at BETWEEN '...' AND '...'
```

**Mitigation**:

1. **Check idempotency**: Was `Idempotency-Key` header used?
2. **Rollback manual**: Delete duplicate in DB (preserve one)
3. **Refund double charge**: If payment appears twice in Stripe
4. **Deploy idempotency middleware** if not already active (prevents future)

---

## Triage & Investigation

### **Gather Context (First 5 minutes)**

1. **Check status indicators**:
   - Datadog dashboard: System health, error rate, latency
   - Sentry: Recent errors (sort by frequency)
   - PagerDuty: Recent alerts
   - Logs: Last 100 lines from affected service

2. **Determine scope**:

   ```
   Is it:
   □ All users or specific segment? (region, plan tier, user ID)
   □ One feature or all endpoints?
   □ Consistent or intermittent?
   □ Started at specific time? (correlate with deployments, traffic spike)
   ```

3. **Check recent changes**:
   - Recent deployments? (last 1 hour)
   - Recent config changes?
   - Recent traffic spike or DDoS?
   - Recent database migration?

### **Root Cause Analysis**

Use **5 Whys Framework**:

```
Symptom: API returning 500 errors
  ↓ Why? Database connection timeout
    ↓ Why? Connection pool exhausted
      ↓ Why? New query analyzer code not closing connections
        ↓ Why? Missing try/finally block in analytics service
          ↓ Why? Code review didn't catch resource leak pattern
            → ROOT CAUSE: Code review process needs resource management checklist
```

---

## Mitigation & Recovery

### **Emergency Actions (by severity)**

| Action              | P1  | P2  | P3  | Who             | Time   |
| ------------------- | --- | --- | --- | --------------- | ------ |
| Page on-call        | ✅  | ✅  | ⚪  | First responder | 2 min  |
| Start war room      | ✅  | ✅  | ⏸️  | On-call lead    | 5 min  |
| Notify customers    | ✅  | ⚪  | ❌  | Product         | 10 min |
| Rollback deployment | ✅  | ⏸️  | ❌  | Tech lead       | 10 min |
| Scale up resources  | ✅  | ✅  | ⚪  | DevOps          | 5 min  |
| Feature flag toggle | ⏸️  | ⏸️  | ✅  | On-call         | 3 min  |
| Manual data fix     | ⏸️  | ⏸️  | ✅  | DB admin        | 15 min |

### **Recovery Checklist**

```
□ Issue identified and documented
□ Mitigation deployed and verified working
□ Customer notifications sent (if needed)
□ Status page updated to "Investigating" → "Resolved"
□ Monitoring confirms metrics back to normal
□ On-call lead confirms all-clear
```

---

## Post-Incident Review

### **Within 2 Hours of Resolution**

**Incident Report Template** (Google Doc):

```markdown
# Incident: [Short Title]

**Date**: Jan 20, 2024 10:30 AM UTC **Duration**: 45 minutes **Severity**: P2
**Status**: RESOLVED

## Summary

[2-3 sentence description of what happened]

## Impact

- ~500 users affected
- 0 data loss
- 0 financial impact
- ~$2K revenue impact (45 min × avg hourly revenue)

## Timeline

10:30 - Error spike detected in Sentry 10:35 - On-call paged, war room started
10:45 - Root cause identified: memory leak in analytics 10:50 - Feature flagged
off 10:55 - Services stabilized, error rate back to 0.01%

## Root Cause

New analytics collector in v2.3.1 not clearing in-memory buffers. Even though
code incremented buffer counter in loop, garbage collection didn't run, causing
OOMKilled.

## Resolution

- Deployed v2.3.2 with explicit buffer.clear() in finally block
- Enabled heap snapshot on-demand monitoring
- Added memory usage alerting at 70% threshold

## Action Items

- [ ] Add memory leak tests to CI (assignee: @dev1, due: Jan 22)
- [ ] Update code review checklist for resource management (assignee: @lead1,
      due: Jan 23)
- [ ] Implement memory profiling dashboard (assignee: @devops1, due: Jan 27)
- [ ] Update on-call runbook with OOMKilled troubleshooting (assignee: @dev2,
      due: Jan 23)

## Further Reading

- Sentry Error Group: [link]
- Datadog Dashboard: [link]
- GitHub PR: [v2.3.2 fix]
```

### **Full Post-Mortem (Within 24 hours)**

1. **What happened?** - Timeline of events
2. **Why did it happen?** - Root cause analysis (5 whys)
3. **How did we detect it?** - Monitoring effectiveness
4. **How did we respond?** - Response quality assessment
5. **What will we do differently?** - Process improvements + action items
6. **What would have prevented it?** - Future proofing

**Publish** in wiki and link in Slack #incidents

### **Metrics to Track**

- **MTTR** (Mean Time To Recovery): From detection to resolution
- **MTTD** (Mean Time To Detection): From impact to alert
- **MTBF** (Mean Time Between Failures): How often do incidents happen?
- **Impact Duration**: How long were users impacted?

---

## Tools & Resources

### **Diagnostic Commands**

```bash
# API health check
curl -v https://api.infamous-freight.com/api/health

# Pod logs
kubectl logs -n infamous-freight-api deployment/api --tail=100 -f

# Resource usage
kubectl top node
kubectl top pod -n infamous-freight-api

# Database query logs
psql -h $DB_HOST -U $DB_USER $DB_NAME -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Stripe transaction check
stripe charges list --limit=10 # via stripe CLI

# Datadog dashboard
# https://app.datadoghq.com/dashboard/lists

# Sentry issues
# https://sentry.io/organizations/infamous-freight/issues/
```

### **Escalation Contacts**

| Role             | Name       | Slack    | Phone       |
| ---------------- | ---------- | -------- | ----------- |
| On-Call Engineer | [rotation] | @on-call | [PagerDuty] |
| Tech Lead        | @lead1     | @lead1   | 555-0100    |
| CTO              | @cto       | @cto     | 555-0101    |
| VP Product       | @vprod     | @vprod   | 555-0102    |

---

## Quick Reference

### **70 Seconds to Context**

1. **Check realtime**: Datadog System dashboard
2. **Check errors**: Sentry sort by frequency
3. **Check alerts**: PagerDuty + #alerts Slack
4. **Check recent**: Git log for deployments (last 1h)
5. **Start war room**: Reach out to on-call lead in Slack

### **Common Fixes**

| Issue                     | Fix                                             | Time   |
| ------------------------- | ----------------------------------------------- | ------ |
| Pod crashing              | `kubectl logs` find error, rollback or restart  | 10 min |
| Connection pool exhausted | Increase `DATABASE_POOL_SIZE`, restart          | 5 min  |
| Memory spike              | Identify leaky code path, feature flag off      | 15 min |
| 5xx errors                | Check Sentry for exception, deploy fix          | 20 min |
| Slow queries              | Add index, enable pagination, increase replicas | 30 min |
| Duplicate charges         | Enable idempotency, refund in Stripe            | 10 min |

---

**Version 1.0** | Last updated: January 2024 | Maintained by: Platform Team
