# Runbook: Emergency Rollback

**Duration:** 5-10 minutes  
**Risk Level:** Very Low (reverting to known-good state)  
**Expected Outcome:** Return to previous stable version

---

## 🚨 When to Trigger Emergency Rollback

Immediate rollback if:

- [ ] Site returns 500 errors (> 50% of requests)
- [ ] Database connection completely down
- [ ] Authentication broken for all users
- [ ] Data corruption detected
- [ ] Performance degraded by > 50%
- [ ] Critical feature broken/unusable

**Do NOT rollback for:**

- Single user issues
- Minor visual bugs
- Non-critical feature problems
- Performance < 10% degradation

---

## Emergency Response Steps

### Step 1: ACKNOWLEDGE (Immediate, < 1 minute)

**Post in #incidents Slack channel:**

```
🚨 INCIDENT: ROLLBACK IN PROGRESS
Severity: [CRITICAL/HIGH]
Current Issue: [brief description]
Previous working version: v[X.Y.Z]
ETA to restore: 5 minutes
Status updates: Every 2 minutes
```

**Example:**

```
🚨 INCIDENT: Rolling back due to database connection failures
Severity: CRITICAL
Issue: 500 errors on all API endpoints
Previous version: v1.2.3
ETA: 5 minutes
```

### Step 2: ASSESS (< 2 minutes)

**Quick diagnostics:**

```bash
# 1. Verify the problem
curl -s https://your-domain.com/api/health
# If 500 or timeout → proceed with rollback

# 2. Check recent deployment
# Vercel Dashboard → Deployments
# Identify: Last version marked ✅ (working)

# 3. Estimate impact
# Sentry Dashboard → Issues
# Note: Number of affected users, time started

# 4. Record details
echo "Failure started: $(date)" > /tmp/incident.log
echo "Last working version: v1.2.3" >> /tmp/incident.log
```

### Step 3: ROLLBACK (< 5 minutes)

**Option A: Fastest (Vercel Dashboard)**

```
1. Go to: https://vercel.com/dashboard/deployments
2. Find the most recent "Ready" deployment (usually the one before current)
3. Click the "..." menu
4. Click "Rollback"
5. Confirm when prompted
6. Wait for re-deployment (usually < 2 minutes)
```

**Option B: Git Revert (if Dashboard not accessible)**

```bash
# 1. Revert the last commit
git revert HEAD --no-edit

# 2. Push to main (auto-deploys via CI)
git push origin main

# 3. Wait for Vercel to re-deploy
# Vercel Dashboard → Deployments (watch status)
```

**Option C: Blue/Green Toggle (if configured)**

```bash
# 1. Check current active environment
echo $ACTIVE_COLOR_API

# 2. Switch to previous (opposite) color
# If ACTIVE_COLOR_API=green, set to blue
gh secret set ACTIVE_COLOR_API --env production "blue"

# 3. This should activate previous deployment immediately
```

### Step 4: VERIFY (1 minute after rollback started)

**Immediate checks:**

```bash
# 1. Health endpoint (should return 200)
curl -s https://your-domain.com/api/health
# Expected: {"ok":true}

# 2. Site loads (no 500 errors)
curl -s -I https://your-domain.com | head -5
# Expected: HTTP/2 200 OK

# 3. Check error rate
# Sentry Dashboard: Issues tab
# Should see error rate dropping (green graph)

# 4. Manual user test
# Visit the site in browser
# Log in with test account
# Perform basic action (create shipment, etc.)
```

### Step 5: COMMUNICATE (Every 2 minutes)

**Post status updates:**

```
🔴 INCIDENT: Rollback in progress
├─ Issue: Database errors
├─ Rollback version: v1.2.3
├─ Status: Verifying health endpoints
└─ ETA: 3 minutes to stable

[After 3 minutes]
✅ INCIDENT: Rollback successful
├─ Deployed version: v1.2.3
├─ Status: Healthy
├─ Error rate: Back to normal
└─ Next: Running diagnostics on failed version
```

### Step 6: STABILIZATION (5-10 minutes post-rollback)

**Ensure stability:**

```bash
# 1. Monitor for 10 minutes without new errors
for i in {1..10}; do
  ERRORS=$(curl -s "https://sentry.io/api/..." | jq '.[] | length')
  echo "Check $i: $ERRORS new errors"
  sleep 60
done

# 2. Check performance metrics
# Datadog/APM Dashboard: Should see normal latencies returning

# 3. User feedback
# Slack: Ask users to confirm service is working
# "Please test and reply if everything looks normal"
```

### Step 7: POST-INCIDENT (After stabilization)

**Immediate actions:**

```bash
# 1. Post in Slack
✅ INCIDENT RESOLVED
├─ Service: Back to normal
├─ Duration: 8 minutes
├─ Status: All systems healthy
├─ Root cause: Will investigate
└─ Post-mortem: Scheduled for tomorrow 10am PT

# 2. Document what happened
cat > /tmp/incident-summary.md << EOF
## Incident Report

**Date:** $(date)
**Duration:** X minutes
**Downtime:** Y users affected
**Root cause:** [TBD]
**Resolution:** Rolled back to v1.2.3
**Lessons learned:** [to be determined in post-mortem]
EOF

# 3. Schedule post-mortem
# Create calendar event: "Production Incident Post-Mortem"
# Attendees: Engineering team, product
# Duration: 30 minutes
# Agenda: What happened, why, how to prevent
```

---

## Escalation Matrix

| Severity             | Response | Escalate After | Manager | CTO |
| -------------------- | -------- | -------------- | ------- | --- |
| CRITICAL (>50% down) | 2 min    | 5 min          | ✅       | ✅   |
| HIGH (10-50% down)   | 5 min    | 15 min         | ✅       | ✓   |
| MEDIUM (1-10% down)  | 10 min   | 30 min         | ✓       | ✓   |
| LOW (< 1% down)      | 30 min   | 60 min         | ✓       | ✗   |

---

## Rollback Decision Tree

```
┌─────────────────────────┐
│ Issues Detected?        │
└───────────┬─────────────┘
            │ YES
            ├──────────────────────────────────┐
            │                                  │
    ┌───────▼────────┐          ┌─────────────▼─────┐
    │ > 50% users    │         │  < 5% users       │
    │ affected?      │         │ affected?         │
    └────┬───────────┘         └──────────┬────────┘
         │ YES                            │ NO
         │                                │
    ┌────▼──────────────┐        ┌───────▼─────────────┐
    │ IMMEDIATE ROLLBACK│        │ Wait & Monitor      │
    │ 🔴 Go to Step 3   │        │ ✓ Check logs        │
    └────────────────────┘       │ ✓ Contact on-call   │
                                 │ ✓ Re-assess at 5min │
                                 └─────────────────────┘
```

---

## Common Rollback Scenarios

### Scenario 1: Database Connection Failed

**Symptoms:**

- All API requests return 500
- Logs show "Connection timeout"
- Health endpoint returns 500

**Rollback trigger:** YES - CRITICAL

```bash
# Execute rollback
# See: Step 3 Option A or B

# After rollback succeeds:
# 1. Wait 5 min for DB to stabilize
# 2. Check Sentry for errors
# 3. Post in #database slack for investigation
```

### Scenario 2: Memory Leak (Slow Degradation)

**Symptoms:**

- Response times increasing over 30 minutes
- Some requests timeout
- Error rate gradually increasing

**Rollback trigger:** MAYBE - depends on severity

```bash
# If performance < 5s p95 latency: Monitor, don't rollback
# If performance > 10s p95 latency: Consider rollback
# If timeouts increasing: Execute rollback

# Decision: Talk to on-call engineer first
```

### Scenario 3: Authentication Broken

**Symptoms:**

- Users cannot log in
- 401 errors on all authenticated endpoints
- JWT validation failing

**Rollback trigger:** YES - CRITICAL

```bash
# Immediate rollback
# UNLESS: Issue is secret misconfiguration
#   (then just fix secret, don't rollback)

# Check: Did secrets change in this deployment?
git log -p -1 | grep "JWT_SECRET\|NEXTAUTH"
# If no: Rollback
# If yes: Check secret value instead
```

### Scenario 4: Memory/CPU Exhaustion

**Symptoms:**

- Server becomes unresponsive
- Requests hanging (no response)
- CPU at 100%, Memory at 100%

**Rollback trigger:** YES - CRITICAL

```bash
# Immediate rollback
# Previous version likely more stable

# Note: Check for:
# - N+1 queries added in new code
# - Memory leaks in new dependencies
# - Infinite loops in new logic
```

---

## What NOT to Do

❌ **Don't:**

- Wait too long to rollback (> 10 minutes of downtime)
- Rollback without verification (check health first)
- Deploy a fix without testing (skip the fix, rollback is safer)
- Forget to notify stakeholders
- Skip the post-mortem (we learn from incidents)

✅ **Do:**

- Act quickly and decisively
- Verify health before moving forward
- Over-communicate status
- Document everything
- Hold post-mortem 24 hours later

---

## Post-Mortem Template

```markdown
# Production Incident Post-Mortem

**Date:** [Date]
**Service:** Production
**Duration:** [X minutes]
**Status Pages Updated:** [Yes/No]
**Root Cause:** [What actually caused the issue]

## Timeline
- HH:MM - Issue detected
- HH:MM - Incident declared
- HH:MM - Rollback started
- HH:MM - Rollback verified (service stable)
- HH:MM - Post-mortem called

## What Happened
[Detailed description of issue]

## Why It Happened
[Root cause analysis]

## How We Responded
- Time to detect: X minutes
- Time to rollback: Y minutes
- Time to stable: Z minutes

## Impact
- Users affected: ~[N]
- Requests failed: ~[N]
- Data loss: Yes/No, describe

## What We'll Do To Prevent
1. [Action item #1 - owner, deadline]
2. [Action item #2 - owner, deadline]
3. [Action item #3 - owner, deadline]

## Follow-Up
- [ ] Fix root cause
- [ ] Add automated tests
- [ ] Update runbooks
- [ ] Schedule training if needed
```

---

## Quick Reference Card

```
🚨 ROLLBACK QUICK REFERENCE

WHEN: Service returning 500, database down, auth broken
WHERE: Vercel Dashboard → Deployments
HOW: Click "..." → Rollback

VERIFY:
✓ curl https://domain.com/api/health → 200
✓ site loads in browser
✓ no errors in Sentry
✓ ask users if working

COMMUNICATE:
✓ Slack #incidents updates
✓ Status page if available
✓ Post-mortem within 24 hours

ETA: 5-10 minutes total
```

---

**Need Help?**

- On-call engineer: [on-call number]
- Slack: #incidents
- Documentation: PRODUCTION_READINESS_100.md
- Sentry: <https://sentry.io/organizations/infamousfreight/>

**Remember:** Rollbacks are safe and expected. It's OK to rollback. Better to be safe than sorry! ✅
