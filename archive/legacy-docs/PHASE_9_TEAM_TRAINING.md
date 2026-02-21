# Phase 9: On-Call Team Training Program

**Duration**: 2 hours  
**Target Audience**: All on-call engineers  
**Status**: Ready for immediate training

---

## Training Agenda

### 1. Architecture Overview (30 minutes)

**Learning Objectives:**

- Understand Infamous Freight system architecture
- Identify critical components and dependencies
- Know who to contact for each system

#### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Infamous Freight API                     │
├──────────────┬─────────────────────┬───────────────────────┤
│   Web App    │   Mobile App        │   Admin Dashboard     │
│   (Vercel)   │   (React Native)    │   (Internal)          │
└──────────────┴─────────────────────┴───────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Express.js API (Fly.io)                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Routes: Shipments, Drivers, Users, Billing, Voice  │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ Middleware: Auth, Validation, Rate Limits, Security│  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        ↓              ↓              ↓              ↓
    ┌────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────┐
    │Postgres│  │ Redis   │  │  Sentry  │  │  Datadog    │
    │   DB   │  │ Cache   │  │ Tracking │  │   APM       │
    └────────┘  └─────────┘  └──────────┘  └─────────────┘
```

**Key Points:**

- API is stateless (can restart anytime)
- Database is the single source of truth
- Cache (Redis) is optional (clear if needed)
- Error tracking (Sentry) and APM (Datadog) are monitoring

**Contact Tree:**

- API down → Page Backend Lead
- Database issue → Page DBA on-call
- Cache issue → Backend Lead (can restart)
- Monitoring unavailable → Platform team

---

### 2. How to Interpret Logs (20 minutes)

**Learning Objectives:**

- Read and understand API logs
- Identify error patterns
- Extract actionable information

#### Log Format

```json
{
  "timestamp": "2026-01-22T10:30:45.123Z",
  "level": "error",
  "message": "Request failed",
  "path": "/api/shipments/123",
  "method": "POST",
  "status": 500,
  "duration": 234,
  "user": "user-id-123",
  "error": "Database connection timeout"
}
```

#### Fetching Logs

```bash
# View real-time logs
flyctl logs -a infamous-freight-api

# Filter by error level
flyctl logs -a infamous-freight-api | grep "error"

# Filter by endpoint
flyctl logs -a infamous-freight-api | grep "/api/shipments"

# Last 100 lines
flyctl logs -a infamous-freight-api | tail -100

# With timestamps
flyctl logs -a infamous-freight-api --json | jq '.timestamp, .message'
```

#### Common Error Patterns

| Pattern                   | Meaning                   | Action                                    |
| ------------------------- | ------------------------- | ----------------------------------------- |
| `500 error`               | Server error              | Check Sentry, restart API if persistent   |
| `429 Too Many Requests`   | Rate limit hit            | Check if legitimate traffic spike         |
| `503 Service Unavailable` | API down                  | Check instances, restart if needed        |
| `401 Unauthorized`        | Auth failed               | Check AUTH_SECRET, review auth logs        |
| `ECONNREFUSED`            | DB connection failed      | Check database, verify connection pool    |
| `TIMEOUT`                 | Operation taking too long | Check query performance, restart if stuck |

**Hands-on Exercise:**

```bash
# Try: ./runbook-automation.sh parse-logs error
# Try: ./runbook-automation.sh parse-logs database
# Try: ./runbook-automation.sh filter-logs-by-type 500
```

---

### 3. Common Incident Types (30 minutes)

**Learning Objectives:**

- Recognize incident types quickly
- Know the first action to take
- Escalate appropriately

#### Type 1: High Error Rate

**Symptoms:**

- Error count spike in Sentry
- Datadog alert: "Error rate > 1%"
- Users reporting errors

**Initial Response:**

```bash
# 1. Check what's happening
./runbook-automation.sh parse-logs error

# 2. Get error details
curl -s https://sentry.io/api/0/organizations/infamous-freight/events/
```

**Common Causes:**

- Deployment issue (recent code change)
- Rate limiting (traffic spike)
- Database connection pool exhausted
- External dependency down

**Resolution:**

- If recent deploy: Rollback with `flyctl releases rollback`
- If traffic spike: Scale up with `./runbook-automation.sh scale 3`
- If DB issue: Check connection pool

#### Type 2: High Latency

**Symptoms:**

- Datadog alert: "P95 latency > 500ms"
- Users complaining about slowness
- Dashboard shows response time spike

**Initial Response:**

```bash
# 1. Check API health
./runbook-automation.sh health-check

# 2. Check database performance
./runbook-automation.sh test-db

# 3. Check cache status
./runbook-automation.sh diagnose-cache
```

**Common Causes:**

- Slow database queries (missing indexes)
- Cold cache (just started or cleared)
- High CPU (need to scale)
- Memory leak (restart needed)

**Resolution:**

- Clear cache: `./runbook-automation.sh clear-cache`
- Scale up: `./runbook-automation.sh scale 3`
- Restart if memory issue: `./runbook-automation.sh restart-api`

#### Type 3: Database Errors

**Symptoms:**

- Errors like "ECONNREFUSED", "connection timeout"
- 503 Service Unavailable
- Sentry showing database errors

**Initial Response:**

```bash
# 1. Test database
./runbook-automation.sh test-db

# 2. Check connection pool
flyctl logs -a infamous-freight-api | grep "connection\|pool"

# 3. Check if issue is widespread
curl -s https://api.fly.dev/api/health | jq '.database'
```

**Resolution:**

- Restart API: `./runbook-automation.sh restart-api`
- Scale up: `./runbook-automation.sh scale 2`
- Escalate to DBA if persists

#### Type 4: Authentication Failures

**Symptoms:**

- 401 Unauthorized errors spike
- Users unable to login
- Sentry: "Invalid token" errors

**Initial Response:**

```bash
# 1. Check auth logs
./runbook-automation.sh filter-logs-by-type auth

# 2. Verify AUTH_SECRET is set
flyctl secrets list -a infamous-freight-api | grep AUTH_SECRET

# 3. Check rate limiting on auth endpoint
./runbook-automation.sh filter-logs-by_type rate_limit
```

**Resolution:**

- If recently rotated AUTH_SECRET: Verify it was set correctly
- If rate limited: Check if legitimate users or attack
- Clear cache if tokens cached: `./runbook-automation.sh clear-cache`

#### Type 5: Cache Issues

**Symptoms:**

- Redis connection errors
- High database load (cache not working)
- Memory errors in logs

**Initial Response:**

```bash
# 1. Diagnose cache
./runbook-automation.sh diagnose-cache

# 2. Clear cache
./runbook-automation.sh clear-cache

# 3. Verify API recovers
./runbook-automation.sh health-check
```

**Resolution:**

- Clear cache if corrupted: Always safe
- Restart if Redis failing: Let Fly.io handle it
- Scale if memory issues: Add more instances

---

### 4. Escalation Procedures (15 minutes)

**Learning Objectives:**

- Know when to escalate
- Escalate to correct team
- Document escalation

#### Severity Levels

| Level       | Response Time       | On-Call                  |
| ----------- | ------------------- | ------------------------ |
| 🔴 CRITICAL | Immediate (< 5 min) | Page primary + secondary |
| 🟠 HIGH     | Within 15 minutes   | Page primary             |
| 🟡 MEDIUM   | Within 1 hour       | Slack notification       |
| 🟢 LOW      | Next business day   | Email                    |

#### Escalation Matrix

```
User-facing errors > 1% or API completely down?
  YES → CRITICAL (page now)

API degraded (slow but working)?
  YES → HIGH (page within 15 min)

Background job failures or minor issues?
  YES → MEDIUM (send Slack)

Documentation issue or enhancement?
  YES → LOW (email)
```

#### How to Escalate

**1. Create PagerDuty Incident:**

```bash
# Use CLI or web interface
# https://infamous-freight.pagerduty.com/incidents

# Or automate:
./runbook-automation.sh escalate critical
```

**2. Notify Team in Slack:**

```
@on-call: 🚨 CRITICAL: API error rate > 5%. Investigating...

Incident: https://pagerduty.com/incidents/...
Sentry: https://sentry.io/organizations/infamous-freight/issues/
Logs: flyctl logs -a infamous-freight-api
```

**3. Document Everything:**

```bash
# Auto-logged with:
./runbook-automation.sh log-incident critical "Description here"
```

#### Escalation Contacts

| Team     | Issue                         | Contact         | Slack Channel   |
| -------- | ----------------------------- | --------------- | --------------- |
| Backend  | API errors, latency           | @backend-lead   | #backend-oncall |
| Database | DB connection, slow queries   | @dba-lead       | #database       |
| Platform | Deployment, Fly.io issues     | @platform-lead  | #platform       |
| DevOps   | Infrastructure, monitoring    | @devops-lead    | #devops         |
| CEO      | Customer impact, revenue risk | @santorio-miles | Direct message  |

---

### 5. Q&A and Incident Simulation (25 minutes)

**Learning Objectives:**

- Practice real incident response
- Gain confidence in tools
- Learn from team experience

#### Simulation Scenarios

**Scenario 1: High Error Rate Spike**

```
Alert: Sentry "Error spike detected - 10% error rate"

What do you do?
1. Check what errors: ./runbook-automation.sh parse-logs error
2. See if recent deploy: git log --oneline -5
3. Check if affecting users: Sentry dashboard
4. Decide: Fix or rollback?
5. Document: ./runbook-automation.sh log-incident high
6. Communicate: Post to #incidents Slack channel
```

**Scenario 2: Database Connection Pool Exhausted**

```
Alert: API returning 503 errors, logs show "connection timeout"

What do you do?
1. Verify: ./runbook-automation.sh test-db
2. Check connections: flyctl logs -a infamous-freight-api | grep connection
3. Scale up: ./runbook-automation.sh scale 3
4. Monitor recovery: ./runbook-automation.sh health-check
5. RCA: Why did this happen? (Recent traffic spike? Query issue?)
```

**Scenario 3: Cache Corruption**

```
Alert: Database load spike, logs show cache misses

What do you do?
1. Confirm cache issue: ./runbook-automation.sh diagnose-cache
2. Clear cache: ./runbook-automation.sh clear-cache
3. Verify recovery: ./runbook-automation.sh health-check
4. Monitor: Watch latency decrease
```

#### Practice Exercise

**Setup:**

- Everyone gets SSH access to staging environment
- Instructor creates intentional failure
- Team responds using runbook automation

**Steps:**

1. Assign roles (incident commander, communicator, fixer)
2. Simulate incident (kill a service, inject errors)
3. Team responds with automation scripts
4. Debrief: What worked, what could improve

---

## Knowledge Check Test

**After training, participants should answer:**

1. **Describe the API architecture in 3 sentences**
2. **What's the first command you'd run if API is down?**
   - Answer: `./runbook-automation.sh health-check`
3. **How do you clear cache if it's corrupted?**
   - Answer: `./runbook-automation.sh clear-cache`
4. **What does a 429 error mean?**
   - Answer: Rate limit exceeded
5. **When do you page immediately vs. send Slack?**
   - Answer: Critical (system down, error rate > 5%) vs. Medium (degraded)
6. **How do you view logs from the last hour?**
   - Answer: `flyctl logs -a infamous-freight-api | tail -100`
7. **What's the rollback command?**
   - Answer: `flyctl releases rollback -a infamous-freight-api`
8. **How do you scale the API to 3 instances?**
   - Answer: `./runbook-automation.sh scale 3`

**Passing criteria:** 7/8 correct

---

## Resources

### Documentation

- [RUNBOOK.md](../RUNBOOK.md) - Detailed procedures
- [MONITORING_SETUP.md](../MONITORING_SETUP.md) - Monitoring config
- [PERFORMANCE_TARGETS.md](../PERFORMANCE_TARGETS.md) - SLO definitions

### Tools

- [runbook-automation.sh](./runbook-automation.sh) - Automation CLI
- Sentry: https://sentry.io/organizations/infamous-freight/
- Datadog: https://app.datadoghq.com/dashboard/
- PagerDuty: https://infamous-freight.pagerduty.com/

### On-Call Schedule

- **Primary**: [View Schedule](https://infamous-freight.pagerduty.com/schedules)
- **Secondary**:
  [View Schedule](https://infamous-freight.pagerduty.com/schedules)
- **Escalation**: Backend Lead → Platform Lead → CTO

---

## Certification

**I have completed Phase 9 On-Call Team Training and can:**

- [ ] Interpret API logs
- [ ] Recognize incident types
- [ ] Use runbook automation scripts
- [ ] Escalate appropriately
- [ ] Document incidents
- [ ] Restore services (restart, scale, clear cache)

**Name**: ****\*\*****\_\_\_\_****\*\*****  
**Date**: ****\*\*****\_\_\_\_****\*\*****  
**Trainer**: ****\*\*****\_\_\_\_****\*\*****

---

**Training Complete! You're now certified to handle Phase 9 on-call incidents.**
🎓

Need help? Ask in #on-call-support or contact your trainer.
