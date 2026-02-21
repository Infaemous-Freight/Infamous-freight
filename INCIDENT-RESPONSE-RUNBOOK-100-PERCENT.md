# Incident Response Runbook

**Status**: ✅ READY FOR USE  
**Date**: February 19, 2026  
**Purpose**: Fast, effective response to production incidents

---

## 1. Quick Reference Card

### Severity Levels

| Level | Response Time | Impact Example |
|-------|---------------|-----------------|
| **SEV1 (Critical)** | < 5 min | Total service down, data loss, security breach |
| **SEV2 (High)** | < 15 min | Service partially down, degraded performance |
| **SEV3 (Medium)** | < 1 hour | Feature unavailable, minor data corruption |
| **SEV4 (Low)** | < 4 hours | Non-critical feature broken, cosmetic issues |

### Standard Escalation

```
Detection → Alert fires
    ↓
Acknowledge (5 min max)
    ↓
On-call engineer responds
    ↓
[SEV1: Page manager if needed] 
[SEV2+: Assign incident commander]
    ↓
War room established
    ↓
Incident investigation & remediation
    ↓
Things restored
    ↓
Post-mortem & improvements
```

---

## 2. SEV1 (Critical) Response

### Timeline: 0-5 minutes

**0-1 min: Alert & Ack**
```bash
# 1. Alert fired in Slack/PagerDuty
# 2. On-call responds: "ack"
# 3. Incident created automatically
# 4. War room link posted
```

**1-3 min: Investigation Begins**
```bash
# Check health endpoints
curl https://infamous-freight-api.fly.dev/api/health

# Check GitHub Actions
# https://github.com/MrMiless44/Infamous-freight/actions

# Check deployment status
# Vercel: https://vercel.com/dashboard
# Fly.io: https://fly.io/dashboard

# Check error rates
# Sentry: https://sentry.io/organizations/infamous-freight
# Datadog: https://app.datadoghq.com
```

**3-5 min: Initial Mitigation**
```bash
# Check recent deployments
git log --oneline -5

# Check for errors
git status

# If deployment issue:
# Option 1: Revert last commit
git revert HEAD --no-edit && git push

# Option 2: Rollback to previous version
# Contact deploy engineer for specific rollback
```

### Checklist: SEV1

- [ ] Acknowledge alert (1 min)
- [ ] Incident commander assigned
- [ ] War room created & team invited
- [ ] Begin investigation (3 min)
- [ ] Identify root cause (5-10 min)
- [ ] Start remediation (10-15 min)
- [ ] Service restored (target: < 30 min)
- [ ] Post-mortem scheduled (before leaving)

---

## 3. SEV2 (High) Response

### Timeline: 0-15 minutes

**0-5 min: Investigation**
```bash
# Get metrics
./scripts/health-check.sh

# Check error logs
# GitHub Actions: View workflow logs
# Sentry: Check error dashboard
# Datadog: View performance metrics

# Check recent changes
git log --oneline -10
git diff HEAD~1
```

**5-15 min: Triage & Fix**
```bash
# Common fixes:
# 1. Database connection issue
psql $DATABASE_URL -c "SELECT 1"

# 2. Memory leak
# Check container metrics
curl https://fly.io/dashboard

# 3. API rate limit  
# Check if hitting throttle limits
grep -i "rate" /var/log/app.log

# 4. Stuck deployment
# Cancel workflow & redeploy
# GitHub Actions > Cancel run > Re-run
```

### Quick Fix Examples

```bash
# Clear cache
redis-cli FLUSHALL

# Restart service
fly apps restart infamous-freight-api

# Scale horizontally
fly scale count cli=2

# Update deployment
git push  # Triggers auto-deploy
```

---

## 4. SEV3 (Medium) Response

### Timeline: 0-60 minutes

**Investigation** (15 min):
- Monitor dashboards
- Gather logs
- Identify pattern

**Remediation** (30 min):
- Develop fix
- Test in staging
- Deploy to production

**Verification** (15 min):
- Confirm fix works
- Monitor metrics
- Close incident

---

## 5. SEV4 (Low) Response

### Standard Process
- File GitHub issue
- Assign to team
- Schedule for next sprint
- No urgency

---

## 6. Common Incident Scenarios

### 6.1: Database Connection Failed

**Symptoms**:
- 500 errors on all API endpoints
- Sentry shows: "connect ECONNREFUSED"
- Health check: database: "disconnected"

**Diagnosis** (2 min):
```bash
# Test connection
psql -h $DB_HOST -U $DB_USER -c "SELECT 1"

# Check connection pool
curl localhost:5432/status 2>&1 | grep -i connection

# Check firewall
nc -zv $DB_HOST 5432
```

**Remediation** (5 min):
```bash
# Option 1: Restart connection pool
fly ssh console -a infamous-freight-api
> killall node

# Option 2: Update connection string
# GitHub > Secrets > DATABASE_URL > Update

# Option 3: Failover to read replica
# Contact DBA for replica activation
```

### 6.2: Memory Leak / Out of Memory

**Symptoms**:
- CPU usage spike
- Memory steadily increasing
- Service crashes after hours
- Logs: "JavaScript heap out of memory"

**Diagnosis** (5 min):
```bash
# Check memory trend
fly logs -a infamous-freight-api | grep -i memory

# Identify memory leak
# Search code for: uncleared cache, event listeners, circular refs

# Reproduce locally
npm --inspect app.js
# Then use Chrome DevTools to capture heap snapshot
```

**Remediation** (15-30 min):
```bash
# Quick fix: Restart service
fly apps restart infamous-freight-api

# Get time for proper fix
# Create GitHub issue with heap snapshot
# Schedule fix in next release

# Workaround: Restart daily
# Add cron job to restart at 2 AM
```

### 6.3: Deployment Failed

**Symptoms**:
- GitHub Actions workflow red ❌
- Previous version still running
- Error in build/deploy logs

**Diagnosis** (2 min):
```bash
# Check workflow logs
# GitHub > Actions > Pick workflow > View logs

# Identify error:
# - Build error?
# - Type error?
# - Deployment API error?
# - Network timeout?
```

**Remediation** (5-15 min):
```bash
# Option 1: Fix code & re-push
git commit --amend
git push

# Option 2: Rollback deployment
git revert HEAD
git push

# Option 3: Re-run workflow
# GitHub > Actions > Workflow > Re-run all jobs
```

### 6.4: Security Breach / Compromise

**Symptoms**:
- Suspicious login attempts detected
- Unauthorized API calls
- Security alert from Sentry/Datadog
- Data exfiltration detected

**Diagnosis** (5 min):
1. Scope: Who has access? What could be exposed?
2. Timeline: When did it start?
3. Evidence: Log details

**Immediate Actions** (15 min):
```bash
# 1. ISOLATE
# Take suspected service offline temporarily

# 2. PRESERVE LOGS
# Export audit logs
# Backup security events

# 3. REVOKE CREDENTIALS
# Rotate all secrets
# Update GitHub Secrets
# Reset API keys

# 4. NOTIFY
# Alert security team
# Prepare user notification (if needed)
```

**Investigation** (1-4 hours):
- Analyze logs for unauthorized access
- Check what was accessed
- Verify data integrity
- Document timeline

**Recovery** (depends):
- Deploy security fixes
- Monitor for recurrence
- Post-incident analysis

### 6.5: Performance Degradation

**Symptoms**:
- Slow response times (P99 > 5s)
- Users reporting slowness
- Datadog showing latency spike
- Database queries taking 10+ seconds

**Diagnosis** (5 min):
```bash
# Check database query times
# Can be slow queries on heavy tables

# Check external API calls
# Wait for third-party services

# Check code bottlenecks
# Look for N+1 queries, inefficient algorithms

# Check infrastructure limits
# Is server hitting CPU/memory limits?
```

**Remediation** (15-60 min):
```bash
# Quick fixes:
# 1. Scale horizontally (add more servers)
fly scale count cli=3

# 2. Clear caches
redis-cli FLUSHALL

# 3. Optimize database queries
# Add indexes

# 4. Rate limit aggressive users
# Deploy rate limiting rules

# Long-term fix:
# Profile code, optimize bottleneck
```

---

## 7. War Room Procedures

### Channel Setup
```
#incident-channel (in Slack)
Create with: incident, channel, zoom link
Post: Incident details, timeline, action items
```

### Communication
```
Every 5 minutes during incident:
"Updates? Status? Timeline?"

On resolution:
"Incident resolved at [TIME]"
"Root cause: [CAUSE]"
"Fix deployed: [URL]"
```

### Roles
```
Incident Commander: Leads response, makes decisions
Technical Lead: Directs technical remediation  
Communications: Updates stakeholders
Scribe: Documents everything for post-mortem
```

---

## 8. Post-Incident Procedures

### Immediate (< 1 hour)

1. **Confirm Resolution**
   - All metrics back to normal
   - No new alerts firing
   - Users reporting service restored

2. **Stabilization Monitoring**
   - Watch for recurrence (30 min)
   - Keep war room open
   - Team on standby

3. **Incident Closure**
   - Close incident ticket
   - Record end time
   - Thank team

### Short-term (24 hours)

1. **Schedule Post-Mortem**
   - Schedule within 24 hours
   - Include: on-call, IC, tech lead, stakeholders
   - Duration: 60 minutes

2. **Gather Information**
   - Export logs
   - Save monitoring dashboards
   - Collect screenshots
   - Document timeline

### Post-Mortem (48-72 hours)

**Agenda** (60 min):
```
1. Timeline (15 min)
   - What happened?
   - When did we detect it?
   - What did we do?
   - When was it resolved?

2. Root Cause Analysis (15 min)
   - What was the root cause?
   - Why didn't we catch this?

3. Impact (10 min)
   - How many users affected?
   - How long was service down?
   - Any data lost?

4. Prevention (15 min)
   - What monitoring do we need?
   - What code changes?
   - What process changes?
   - What training is needed?

5. Action Items (5 min)
   - Who will do what?
   - By when?
   - How will we verify?
```

**Output**: 
- Post-mortem document (shared with team)
- Action items (tracked to completion)
- Prevention measures (implemented before next similar incident)

---

## 9. Escalation Rules

### When to Escalate

**To Manager**:
- SEV1 incident
- Customer-facing outage > 15 min
- Security incident
- Data loss

**To Executive**:
- Major outage > 1 hour
- Security breach
- Customer notification required
- Multiple critical systems affected

**To External Teams**:
- Incident with third-party service
- Issue requires vendor support
- Customer notification needed

---

## 10. Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| On-call | (rotating) | +1-XXX-XXXX | @oncall |
| Engineering Manager | [Name] | +1-XXX-XXXX | @manager |
| Security Lead | [Name] | +1-XXX-XXXX | @security |
| Database Admin | [Name] | +1-XXX-XXXX | @dba |

---

## 11. Tools & Resources

### Monitoring Dashboards
- GitHub Actions: [status](https://github.com/MrMiless44/Infamous-freight/actions)
- Vercel: [dashboard](https://vercel.com/dashboard)
- Sentry: [errors](https://sentry.io/organizations/infamous-freight)
- Datadog: [metrics](https://app.datadoghq.com)

### Incident Management
- Incident ticket: Created automatically on alert
- War room: Slack channel created automatically
- Timeline: Auto-captured from logs

---

## 12. Quick Commands Reference

```bash
# Check system health
./scripts/health-check.sh

# View recent commits
git log --oneline -10

# Check deployment status
fly status -a infamous-freight-api

# View logs
fly logs -a infamous-freight-api

# Restart service
fly apps restart infamous-freight-api

# Scale service
fly scale count cli=2

# View metrics
# Open: https://app.datadoghq.com
```

---

**Keep this runbook accessible during incidents.**

**Last Updated**: February 19, 2026  
**Review Schedule**: Quarterly  
**Next Review**: May 19, 2026

For questions, see: [TROUBLESHOOTING-GUIDE-RECOMMENDED.md](TROUBLESHOOTING-GUIDE-RECOMMENDED.md)
