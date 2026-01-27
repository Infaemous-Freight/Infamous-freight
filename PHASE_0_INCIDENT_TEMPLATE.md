# Incident Response Template

**Organization:** Infamous Freight Enterprises  
**Process:** Standardized incident handling and documentation  
**Owner:** Engineering Team  
**Usage:** Create new GitHub issue from this template when incident occurs

---

## Incident Report (Use This Template)

### Title

```
[INCIDENT] Brief description (e.g., "Database connection pool exhausted" or "Payment processing down")
```

---

## 1. INCIDENT SUMMARY

**Status:** [ ] Open [ ] In Progress [ ] Resolved  
**Severity:** [ ] CRITICAL 🔴 [ ] HIGH 🟡 [ ] MEDIUM 🟠 [ ] LOW 🔵

**Start Time (UTC):** YYYY-MM-DD HH:MM:SS  
**End Time (UTC):** YYYY-MM-DD HH:MM:SS  
**Total Duration:** [X] minutes

**Affected Services:**

- [ ] API (Express backend)
- [ ] Web (Next.js frontend)
- [ ] Database (PostgreSQL)
- [ ] Cache (Redis)
- [ ] External APIs (Stripe, OpenAI, etc.)

**Users Affected:** [Rough estimate: all / 50% / 10% / single user]  
**Revenue Impact:** [$0 / $500 / $5,000 / Unknown]  
**Data Impact:** [ ] None [ ] Read access only [ ] Potential corruption [ ] Data
loss

---

## 2. DETECTION & INITIAL RESPONSE

**How Was This Detected?**

- [ ] Automated alert (PagerDuty)
- [ ] Customer report
- [ ] Team member notice
- [ ] Monitoring dashboard
- [ ] Other: ****\_\_\_****

**Alert Details:**

```
[Paste alert message, error code, stack trace if available]
```

**Detected At:** YYYY-MM-DD HH:MM:SS UTC  
**Reported By:** [Name]  
**Acknowledged By:** [Name] at HH:MM:SS

---

## 3. INCIDENT TIMELINE

**Use This Format:**

```
HH:MM - [Who] - [What happened]
```

**Example:**

```
14:15 - ServiceAlert - High error rate detected (>5%)
14:16 - John (On-Call) - Page received, acknowledged
14:18 - John - Checked Sentry, identified slow database queries
14:22 - John - Restarted API instances to clear connections
14:25 - John - Error rate dropped to <0.5%, system recovering
14:30 - John - All metrics normal, incident resolved
```

**Actual Timeline:**

```
[Start Time] - [Who] - [What]
[Time] - [Who] - [What]
[Time] - [Who] - [What]
[Resolved Time] - [Who] - [What / All Clear]
```

---

## 4. ROOT CAUSE ANALYSIS

### What Broke? (Simple Description)

```
[Plain English description of what stopped working]
Example: "Customers couldn't place shipments for 8 minutes"
```

### Why Did It Break? (Root Cause)

```
[Technical explanation of WHY it happened]
Example: "A slow database query (SELECT * FROM shipments cartesian join drivers)
exhausted the connection pool, causing new connections to timeout"
```

### When Did It Start? (Exact Timestamp)

- **Actual Start:** YYYY-MM-DD HH:MM:SS UTC
- **Detection Delay:** [X minutes from start to alert]
- **Root Cause Identified:** YYYY-MM-DD HH:MM:SS UTC (after [X minutes])

### Contributing Factors

- [ ] Deployment/code change
- [ ] Infrastructure/capacity issue
- [ ] External dependency (external API down)
- [ ] Configuration issue
- [ ] Monitoring gap (should have alerted sooner)
- [ ] Other: ****\_\_\_****

**Details:**

```
[Explain the contributing factors. Example:
- Deployment at 14:10 UTC added new feature
- New feature runs expensive database query on every request
- This query lacks an index, causing full table scan
- At peak traffic (200 req/sec), this exhausted 50-connection pool]
```

---

## 5. RESOLUTION

### What Was Done to Fix It? (Immediate Mitigation)

**Step 1: [First action taken]**

```
[What / When / Why / Result]
Example: Restarted API instances at 14:22 UTC
Why: Forces database connection pool to reset
Result: Connections dropped from 50/50 to 5/50, error rate dropped
```

**Step 2: [Second action taken]**

```
[What / When / Why / Result]
```

**Step 3: [Third action taken (if applicable)]**

```
[What / When / Why / Result]
```

### Verification (How We Confirmed Fix Worked)

- [ ] Error rate back to normal (<0.5%)
- [ ] Response latency normal (<500ms P95)
- [ ] Sentry showing no new errors
- [ ] Customer reports confirming system working
- [ ] Database load normal
- [ ] Cache hit rate normal
- [ ] All health checks passing

**Verification Time:** YYYY-MM-DD HH:MM:SS UTC

---

## 6. PERMANENT FIX (Follow-Up Work)

**Is a permanent fix needed?**

- [ ] No (was transient issue, unlikely to recur)
- [ ] Yes - Code change needed
- [ ] Yes - Infrastructure change needed
- [ ] Yes - Monitoring/alerting improvement needed

### If Yes - What's the fix?

**Fix 1: [Add database index]**

- Type: [ ] Code [ ] Infrastructure [ ] Monitoring [ ] Documentation
- Priority: [ ] Critical (fix today) [ ] High (fix this week) [ ] Medium (fix
  this month)
- Effort: [ ] 30 min [ ] 1-2 hours [ ] Half day [ ] Full day [ ] Multi-day
- Owner: [Name]
- Ticket: [GitHub issue #]
- Expected Outcome: Prevent [specific issue] from recurring

**Fix 2: [Add monitoring alert]**

- Type: [ ] Code [ ] Infrastructure [ ] Monitoring [ ] Documentation
- Priority: [ ] Critical [ ] High [ ] Medium
- Effort: [ ] 30 min [ ] 1-2 hours
- Owner: [Name]
- Ticket: [GitHub issue #]
- Expected Outcome: Catch this issue 5 minutes sooner next time

---

## 7. IMPACT ASSESSMENT

### Who/What Was Affected

**Users:**

- Estimated number affected: [0 / 100 / 1,000 / all]
- Estimated % of user base: [%]
- Affected regions: [US-East / EU / All]
- Affected features: [Which features broken?]

**Revenue:**

- Estimated revenue loss: [$0 / $500 / $5,000 / Unknown]
- Affected transactions: [How many transactions failed?]
- Customers impacted: [Names of key customers if enterprise deals]

**Data:**

- [ ] No data affected
- [ ] Possible data read inconsistency (recovered naturally)
- [ ] Data reads blocked (recovers on fix)
- [ ] Data loss (need backup restore?)
- [ ] Compliance impact (GDPR / SOC 2 breach?)

**Team:**

- People paged: [Names + start time]
- Escalations needed: [Yes / No]
- Additional team called in: [Yes / No]
- Emergency meeting held: [Yes / No]

---

## 8. COMMUNICATION

### External Communication (To Customers)

**Was customer communication sent?**

- [ ] No (internal issue only)
- [ ] Yes - Slack #status-updates message at HH:MM UTC
- [ ] Yes - Email to affected customers at HH:MM UTC
- [ ] Yes - Public status page update at HH:MM UTC

**Communication Sent:**

```
[Paste the message sent or mark "None"]
```

### Internal Communication

**Slack #incidents Message:**

```
[Paste the alert message posted to team]
```

**Email to Engineering Team:**

- [ ] Sent at HH:MM UTC
- [ ] Subject: [Incident Summary]
- [ ] Recipients: [All engineers / Key engineers]

---

## 9. LESSONS LEARNED

### What Went Well ✅

```
1. [How we responded well / fast]
2. [Good monitoring that caught issue]
3. [Team collaboration / communication]
```

### What Could Be Better ⚠️

```
1. [Detection was slow - why?]
2. [Resolution took too long - why?]
3. [Communication unclear - how to improve?]
4. [Alert configuration could be better]
```

### Systemic Issues (Patterns)

```
Have we had similar incidents before?
- [Incident 6 weeks ago: database connection exhaustion]
- [Incident 3 months ago: slow queries]
→ Pattern: Database performance issues recurring
→ Solution: Deeper database optimization needed
```

---

## 10. ACTION ITEMS (FOLLOW-UP)

### Code Changes

- [ ] **Add database index** → [GitHub #123] → Owner: [John] → Due: [Date]
  - Estimated effort: 2 hours
  - Why: Prevent slow queries that led to connection exhaustion

- [ ] **Optimize N+1 query** → [GitHub #124] → Owner: [Jane] → Due: [Date]
  - Estimated effort: 4 hours
  - Why: Reduce database load during peak traffic

### Infrastructure Changes

- [ ] **Increase API instance max** → [GitHub #125] → Owner: [DevOps] → Due:
      [Date]
  - From: 3 instances → To: 5 instances
  - Why: Distribute load better in case of database issues

- [ ] **Add database connection monitoring** → [GitHub #126] → Owner: [DevOps] →
      Due: [Date]
  - Alert when: >70% connection pool used
  - Why: Catch this issue earlier next time

### Monitoring & Alerting

- [ ] **Add slow query alert** → [GitHub #127] → Owner: [John] → Due: [Date]
  - Alert if: P95 latency > 1000ms for >5 min
  - Why: Catch performance degradation before user impact

- [ ] **Add connection pool exhaustion alert** → [GitHub #128] → Owner: [DevOps]
      → Due: [Date]
  - Alert if: Available connections < 5
  - Why: Page on-call before complete exhaustion

### Documentation

- [ ] **Update database tuning guide** → [GitHub #129] → Owner: [Jane] → Due:
      [Date]
  - Why: Share knowledge learned in this incident

- [ ] **Create runbook for this scenario** → [GitHub #130] → Owner: [John] →
      Due: [Date]
  - Why: Speed up response time if it happens again

### Process Improvements

- [ ] **Weekly database health check** → [GitHub #131] → Owner: [DevOps] → Due:
      [Date]
  - Cadence: Every Friday at 2 PM UTC
  - Why: Proactively find issues before they cause incidents

---

## 11. POST-INCIDENT REVIEW

**Scheduled Post-Mortem Meeting:**

- Date: [YYYY-MM-DD]
- Time: [HH:MM UTC]
- Duration: [60 minutes]
- Attendees: [On-call + Backend lead + DevOps + Manager + Optional: QA, Product]
- Location: [Zoom link]

**Meeting Outcome:**

```
[To be filled after meeting:
- Team agrees on action items?
- Root cause clearly understood?
- Preventive measures acceptable?
- Any disagreements resolved?
]
```

---

## 12. SIGN-OFF

| Role                | Name   | Signature | Date       |
| ------------------- | ------ | --------- | ---------- |
| On-Call Engineer    | [Name] |           | YYYY-MM-DD |
| Engineering Manager | [Name] |           | YYYY-MM-DD |
| Team Lead           | [Name] |           | YYYY-MM-DD |

---

## QUICK REFERENCE

**Incident Severity Guide:**

- **CRITICAL 🔴**: All users affected, revenue loss, potential data loss = **5
  min SLA**
- **HIGH 🟡**: 50%+ users affected or specific feature broken = **15 min SLA**
- **MEDIUM 🟠**: <50% users affected, workaround available = **Next business
  day**
- **LOW 🔵**: Minor issue, no user impact = **Backlog**

**Key Metrics:**

- Time to Detection: [Start time → Alert time] = \_\_\_ minutes
- Time to Mitigation: [Alert time → First fix] = \_\_\_ minutes
- Time to Resolution: [Alert time → All clear] = \_\_\_ minutes
- Total Duration: \_\_\_ minutes

**SLA Compliance Check:**

- [ ] Detected within 5 min of actual start?
- [ ] Responded within SLA (5/15 min based on severity)?
- [ ] Resolved within acceptable timeframe?
- [ ] Customer notified if needed?
- [ ] Post-mortem scheduled within 48 hours?

---

**For Questions:**

- Sentry: https://sentry.io/organizations/infamous-freight
- Dashboards: [Link to monitoring dashboard]
- Slack: #incidents
- Emergency: [Phone numbers in on-call playbook]

---

**Document Version:** 1.0  
**Created:** January 27, 2026  
**Template Location:** [Link to this document]  
**Last Incident:** [Date]  
**Total Incidents This Year:** [X]
