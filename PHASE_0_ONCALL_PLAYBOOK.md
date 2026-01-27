# On-Call Playbook & Rotation

**Status:** Active  
**Last Updated:** January 27, 2026  
**Owner:** Engineering Manager  
**Audience:** All engineering team members

---

## 1. On-Call Rotation Schedule

### Current Rotation (Q1 2026)

| Week            | Primary On-Call   | Secondary       | Backup          |
| --------------- | ----------------- | --------------- | --------------- |
| Jan 27 - Feb 2  | [Assign Lead Dev] | [FrontEnd Lead] | [DevOps Lead]   |
| Feb 3 - Feb 9   | [FrontEnd Lead]   | [DevOps Lead]   | [Backend 2]     |
| Feb 10 - Feb 16 | [DevOps Lead]     | [Backend 2]     | [Lead Dev]      |
| Feb 17 - Feb 23 | [Backend 2]       | [Lead Dev]      | [FrontEnd Lead] |
| Feb 24 - Mar 2  | Repeat Cycle 1    | Repeat          | Repeat          |

### Rotation Principles

- **Duration:** Monday 9 AM - Sunday 11:59 PM (US/Eastern)
- **Handoff:** Sunday evening sync (brief check-in)
- **Coverage:** 24/7/365 (including weekends, holidays)
- **Load:** Approximately 1 week per month for 4-person rotation
- **Escalation:** Primary → Secondary (5 min) → Backup (5 min more)

### Compensation

**Option A - Flat Rate:**

- $150/week flat (or equivalent PTO day)
- Works well for predictable volume

**Option B - Incident-Based:**

- $50/incident response (if handled)
- $100/critical incident (if production down >5 min)
- $200/major incident (if data affected, >1 hour down)

**Recommended:** Use Option A for predictability + Option B multiplier for major
incidents

---

## 2. Escalation Policy

### Severity Levels

**🔴 CRITICAL (Page Immediately)**

- Production service down (all users affected)
- Data corruption / data loss risk
- Security breach / data leak detected
- Revenue-impacting outage (billing down, payment fails)
- **SLA:** Respond within 5 minutes
- **Page:** Primary on-call
- **Escalate to:** Secondary if no response in 5 min, Backup if secondary
  unresponsive

**🟡 HIGH (Page, Non-Blocking)**

- Service degraded but partially working (some users affected)
- API latency P95 > 2 seconds
- Error rate > 5%
- Database connection pool near limit
- Memory usage > 85%
- **SLA:** Respond within 15 minutes
- **Page:** Primary on-call
- **Can:** Create incident, start investigation

**🟠 MEDIUM (Ticket + Standup)**

- Minor features broken but core functions work
- Non-production environment issues
- Documentation needs updating
- Performance degradation not impacting users yet
- **SLA:** Respond by next business day
- **Action:** Slack message, included in standup

**🔵 LOW (Backlog)**

- Feature requests
- Performance optimization opportunities
- Refactoring ideas
- **SLA:** No immediate action required
- **Action:** Add to backlog for next sprint planning

### Escalation Tree

```
Alert Triggered
    ↓
PagerDuty notifies Primary On-Call
    ↓
Primary responds within 5 min?
├─ YES: Investigate & resolve
├─ NO: Page Secondary On-Call after 5 min
         ↓
         Secondary responds within 5 min?
         ├─ YES: Secondary takes over
         ├─ NO: Page Backup after 5 min more
                ├─ YES: Backup takes over
                ├─ NO: Page Engineering Manager immediately
```

---

## 3. Incident Response Workflow

### Step 1: Triage (0-2 minutes)

**When paged:**

1. ✅ Acknowledge alert in PagerDuty (stops paging)
2. ✅ Open Sentry / dashboard to assess severity
3. ✅ Post in Slack #incidents: "Investigating [issue]"
4. ✅ Determine: Is this CRITICAL or HIGH?

**Questions to ask:**

- How many users affected? (1 user vs 1K users)
- What revenue impact? (none vs $1K/hour)
- What data at risk? (none vs customer PII)
- How obvious is the fix? (5 min vs 5 hours)

**Outcome:** Severity level determines next actions

### Step 2: Mitigate (2-10 minutes)

**CRITICAL incidents - Fastest short-term stable state:**

```
Option A: Scale up
- Increase API instances (Fly.io: from 1 → 3 instances)
- Increase database connections (slow, skip if possible)
- Clear cache and restart service

Option B: Route traffic
- Disable non-critical features (feature flags)
- Redirect heavy traffic to backup region
- Enable read-only mode (if writes are causing issue)

Option C: Rollback
- Revert last deployment (if deployed recently)
- Use blue-green deployment to switch back to previous version
- Database rollback (last resort - risky)

Option D: Communicate
- Post customer status page update
- Slack to #incidents channel
- Email if >1 hour: update users@company
```

**Choose fastest option, usually A or B first, then investigate root cause in
parallel**

### Step 3: Investigate (5-60 minutes)

**Tools & Dashboards:**

1. Open Sentry dashboard: https://sentry.io/organizations/infamous-freight
2. Check logs: CloudWatch or Vercel logs
3. Database health: Connection count, slow queries
4. API health: Request latency, error rates by endpoint
5. Infrastructure: CPU, memory, disk usage on Fly.io
6. Recent changes: Check git log for commits in last 30 min

**Investigation checklist:**

- [ ] When exactly did it start? (check logs for timestamp)
- [ ] What changed? (recent deployment? config change? external API issue?)
- [ ] Is it widespread or isolated? (all users vs specific region)
- [ ] Is data/revenue being lost right now? (if yes, critical)
- [ ] Can we reproduce it? (manually trigger the issue)

### Step 4: Resolve (Time varies)

**Once root cause identified:**

1. Fix code (if it's a code bug)
2. Deploy code (or rollback if reverting)
3. Monitor metrics for 5-10 minutes (ensure fix worked)
4. Post update: "Issue resolved, monitoring"

**Verification:**

- [ ] Error rate back to <0.5%
- [ ] Response latency normal
- [ ] No new errors in Sentry
- [ ] Customers confirming system working

### Step 5: Post-Mortem (24-48 hours after)

**Schedule meeting:** 30-60 minutes, all team leads + eng manager

**Topics:**

1. **What happened?** - Clear description of issue
2. **Why did it happen?** - Root cause analysis
3. **Timeline** - When detected, when fixed, total duration
4. **Impact** - Users affected, revenue lost, data affected
5. **What we'll do differently** - Preventive measures
6. **Action items** - Code changes, monitoring additions, etc.

**Output:** Post-mortem document in Google Drive, shared with team

---

## 4. On-Call Tools & Setup

### Required Access

**Before starting on-call shift, verify you have:**

- [ ] PagerDuty access (login: your@email.com)
- [ ] Sentry access (https://sentry.io/organizations/infamous-freight)
- [ ] CloudWatch access (AWS console)
- [ ] Vercel access (Web logs)
- [ ] Fly.io access (API logs and scaling)
- [ ] GitHub access (for quick repo checks)
- [ ] Slack access (for #incidents channel)
- [ ] Mobile phone with notifications enabled

### Tool Configuration (Do Once)

**PagerDuty Setup:**

```
1. Go to: https://pagerduity.com/apps
2. Download PagerDuty mobile app
3. Enable phone notifications
4. Set up SMS escalation (if available)
5. Test a dummy alert
```

**Sentry Setup:**

```
1. Create Sentry API token (Settings → API)
2. Save token in password manager
3. Create browser bookmark: https://sentry.io/organizations/infamous-freight/issues/
4. Test access from mobile device
```

**Slack Setup:**

```
1. Join #incidents channel
2. Enable notifications for @pagerduty mentions
3. Turn OFF @everyone and @channel from other channels (too noisy)
```

**Fly.io Console:**

```
1. Go to: https://fly.io/apps/infamous-freight-api
2. Save as browser bookmark
3. Bookmark the logs page: https://fly.io/apps/infamous-freight-api/logs
```

### On Call During Sleep

**Phone Configuration:**

- [ ] Phone in bedroom (on charger, not silent mode)
- [ ] PagerDuty app notifications enabled (loud)
- [ ] SMS alerts enabled as backup
- [ ] Alarms for critical events (not silent)

**Policy:**

- Respond to page within 5 minutes (realistically: grab phone, read alert, start
  investigating)
- If not awake: Answer phone directly from Critical alert (caller = team member
  verifying)
- After resolving critical incident: Sleep debt compensation (come in late next
  day or take afternoon off)

---

## 5. Common Scenarios & Playbooks

### Scenario 1: Database Connection Pool Exhausted

**Symptoms:**

- API returns "connection timeout" errors
- Sentry shows: "connect timeout" errors
- Database metrics show: All connections in use

**Quick Fix (5 min):**

```bash
# Option 1: Restart API instances (forces connection reset)
fly apps restart infamous-freight-api

# Option 2: Increase connection pool size
# Edit Prisma config: prisma/schema.prisma
# Change: connection_limit from current (e.g., 50) to higher (e.g., 100)
# Redeploy

# Option 3: Kill idle connections (database)
SELECT pid, usename, application_name, state, query_start
FROM pg_stat_activity
WHERE state = 'idle' AND query_start < now() - interval '30 minutes';
-- Then kill idle ones: SELECT pg_terminate_backend(pid) FROM ...
```

**Prevention:**

- Set up alert when connection usage >80%
- Monitor connection pool metrics daily
- Investigate N+1 query problems

---

### Scenario 2: High Memory Usage (API)

**Symptoms:**

- Fly.io dashboard shows memory > 85%
- Slow response times
- Eventual OOM kill = service restart

**Quick Fix (2 min):**

```bash
# Scale up to 2-3 instances (distribute load)
fly scale count 3

# Restart instances to clear memory cache
fly apps restart infamous-freight-api
```

**Investigation:**

- Check for memory leaks (Sentry profiling)
- Look for large uncached queries
- Identify event listeners not properly cleaned up

---

### Scenario 3: External API Timeout (e.g., Stripe, OpenAI)

**Symptoms:**

- Sentry shows: "Timeout waiting for response from stripe.com"
- Billing features or AI features failing
- Other features fine

**Quick Fix (2 min):**

```javascript
// Check if external service is down:
// https://status.stripe.com or similar

// Immediate: Set feature flag to disable the feature
// In code: if (!featureFlags.stripe_enabled) return cached_result;

// Alternative: Queue and retry
// Instead of failing, queue for retry in 60 seconds
```

**Prevention:**

- Set timeout limits (no waiting >5 seconds)
- Implement circuit breaker pattern (fail gracefully if external service down)
- Use feature flags to disable if external service failing

---

### Scenario 4: Deployment Issue (Code Broke in Production)

**Symptoms:**

- Just deployed a new feature
- Sentry shows new error spike
- Rollback might be fastest fix

**Quick Fix (2-5 min):**

```bash
# Option 1: Rollback to previous version
fly releases list -a infamous-freight-api
# Find the version before the bad deployment
fly releases rollback -a infamous-freight-api --image <previous-sha>

# Option 2: Fix code and redeploy
# Only if you're confident it's a simple fix (e.g., typo, config)
git revert HEAD
git push origin main
# CI/CD will auto-deploy new version
```

**Prevention:**

- Always test locally before pushing
- Run full test suite before merge: `pnpm test`
- Use feature flags for gradual rollout (new features disabled for 99% of users
  first)

---

### Scenario 5: DDoS Attack / Traffic Spike

**Symptoms:**

- Sudden spike in requests (10x normal)
- API response times spiking
- Infrastructure costs spiking
- Legitimate traffic can't get through

**Quick Fix (immediate):**

```
1. Enable CloudFlare DDoS protection (1 click)
2. Increase rate limiting: general limiter from 100 → 50 req/15min
3. Scale API to max instances (to absorb burst)
4. Monitor: Is it legitimate traffic spike or attack?
   - If attack: Enable Cloudflare aggressive rules
   - If legitimate: Celebrate the growth! (then figure out capacity)
```

**Investigation:**

- Check traffic source IPs (Cloudflare logs)
- Check user agents (legitimate vs bot traffic)
- Check which endpoints being hit
- Block suspicious IPs

---

## 6. On-Call Schedule Template

### Print This & Post It

```
┌─────────────────────────────────────────────────────────┐
│           ON-CALL ROTATION - Q1 2026                   │
├─────────────────────────────────────────────────────────┤
│ Week 1 (Jan 27-Feb 2):   PRIMARY: [Name]              │
│                          SECONDARY: [Name]             │
│                                                        │
│ Week 2 (Feb 3-9):        PRIMARY: [Name]              │
│                          SECONDARY: [Name]             │
│                                                        │
│ Week 3 (Feb 10-16):      PRIMARY: [Name]              │
│                          SECONDARY: [Name]             │
│                                                        │
│ Week 4 (Feb 17-23):      PRIMARY: [Name]              │
│                          SECONDARY: [Name]             │
│                                                        │
│ EMERGENCY: Page all 3 (Primary + Secondary + Backup)  │
│ CRITICAL CONTACT: Engineering Manager (phone)         │
│                                                        │
│ Tools: PagerDuty | Sentry | Slack #incidents          │
│ SLA: 5 min response for CRITICAL | 15 min for HIGH    │
│                                                        │
│ Post-Mortem: 24-48 hours after major incident         │
└─────────────────────────────────────────────────────────┘
```

---

## 7. On-Call Handoff Checklist

### End of Week Checklist (Primary On-Call Leaving)

**Sunday Evening, Before Handing Off:**

- [ ] Review last week's incidents (if any)
- [ ] Check Sentry for any unresolved errors that Secondary should know about
- [ ] Verify Secondary has PagerDuty access and tools configured
- [ ] Send Slack message: "@next-primary here's the handoff"
- [ ] Brief sync (15 min) covering:
  - Any ongoing issues?
  - Any known flaky tests or warnings?
  - Any scheduled maintenance this week?
  - Any customer complaints to watch for?

**Handoff Message Template:**

```
🔄 WEEKLY HANDOFF - [Previous] → [Next]

Last week status:
- Incidents: [0 or list]
- Error rate: [Low/Normal/High]
- Performance: [Good/Degraded]
- Any FYI: [anything Next should know]

This week to watch for:
- [Scheduled maintenance date if any]
- [Known flaky feature if any]
- [Customer complaint to monitor if any]

Let me know if you have questions! Available for 30 min if needed.
```

---

## 8. End-of-Week Report

### Report to Submit (Friday Afternoon)

**On-Call Weekly Report Template:**

```markdown
# On-Call Report - Week of [Date]

## Summary

- ON-CALL: [Your Name]
- INCIDENTS: [0] critical, [0] high
- DOWNTIME: [Duration] minutes total
- CUSTOMER IMPACT: [Description or "None"]

## Critical Incidents (If Any)

### Incident 1: [Title]

- Time: [2:15 PM UTC]
- Duration: [8 minutes]
- Impact: [100 users affected, $200 revenue impact]
- Root Cause: [Slow database query]
- Resolution: [Added database index, redeployed]
- Prevention: [Add query monitoring alert]

## Observations

- [Any other issues to discuss at standup?]
- [Any team member who helped resolve issues - shoutout them]
- [Any infrastructure improvements needed?]

## Next Week Notes

- [Anything next on-call should know?]
```

---

## 9. Burnout Prevention

### On-Call Health Practices

**During On-Call Week:**

- ✅ Check phone every 30 min during work hours
- ✅ Keep phone on during sleep (but keep volume reasonable)
- ✅ Respond to critical pages within 5 min (realistically: grab phone)
- ✅ Take breaks (especially after resolving major incident)

**Don't:**

- ❌ Don't work 18-hour days trying to prevent all possible incidents
- ❌ Don't stay up late "just in case" (defeats the purpose)
- ❌ Don't skip meals or exercise during on-call week
- ❌ Don't pull on-call duties 2 weeks in a row (need recovery time)

**Sleep Debt Compensation:**

- If paged multiple times or resolved major incident: Take afternoon off next
  week (stagger: not all immediately)
- If paged 5+ times: Talk to manager about additional time off

**Mental Health:**

- On-call can be stressful, especially with critical systems
- Post-incident: Take 30 min to decompress (walk, meditation, etc.)
- Team support: If on-call person sounds stressed, offer to help investigate

---

## 10. Escalation Contact List

| Role                | Name   | Phone   | Email   | Slack       |
| ------------------- | ------ | ------- | ------- | ----------- |
| Engineering Manager | [Name] | [Phone] | [Email] | @manager    |
| VP Engineering      | [Name] | [Phone] | [Email] | @vp-eng     |
| CTO                 | [Name] | [Phone] | [Email] | @cto        |
| Infrastructure      | [Name] | [Phone] | [Email] | @infra-lead |

**When to Escalate:**

- If incident > 1 hour unresolved → Call VP Engineering
- If data loss risk → Call CTO immediately
- If affecting 50%+ of users → Call emergency meeting (all leads)
- If you're unsure how to proceed → Ask in Slack first (#incidents)

---

## Conclusion

**Key Principles:**

1. Respond fast (5 min SLA for critical)
2. Communicate early (post to #incidents immediately)
3. Mitigate first (quick fix before root cause analysis)
4. Learn from incidents (post-mortem within 48 hours)
5. Take care of yourself (sleep, breaks, don't burn out)

Welcome to on-call! You've got this. 🚀

---

**Document Version:** 1.0  
**Last Updated:** January 27, 2026  
**Next Review:** Q2 2026 (quarterly refresh)
