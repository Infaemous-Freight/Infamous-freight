# Emergency Incident Runbook

## Incident Response Procedure

### Phase 1: Detection & Initial Response (5 mins)

1. **Verify the issue**
   - Is service down? (`curl /api/health`)
   - Error rate > 10%? (Check Sentry)
   - Response time elevated? (Check Datadog)

2. **Alert the team**

   ```
   @channel INCIDENT: [Service Name] - [Brief Description]
   Severity: [Critical/High/Medium]
   Status: Investigating
   ```

3. **Establish war room**
   - Create Slack channel: #incident-[timestamp]
   - Invite on-call engineer + tech lead

### Phase 2: Stabilization (15-30 mins)

#### If Payment Processing Down

```bash
# Check Stripe connectivity
curl -H "Authorization: Bearer $STRIPE_KEY" \
  https://api.stripe.com/v1/payment_intents?limit=1

# Disable new payments (if critical)
# Update environment: ENABLE_PAYMENTS=false
# Restart API: flyctl restart

# Queue payments for retry (manual process)
```

#### If Database Down

```bash
# Check DB connection
psql $DATABASE_URL -c "SELECT 1"

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# If connection pool exhausted
# - Restart affected services
# - Check for connection leaks

# Failover to replica if available
```

#### If API Service Down

```bash
# Check status
flyctl status -a infamous-freight-api

# Check logs for errors
flyctl logs -a infamous-freight-api --level error

# Restart service
flyctl restart -a infamous-freight-api

# Verify health
curl https://api.infamous-freight.com/api/health
```

### Phase 3: Root Cause Analysis (During Stabilization)

| Issue                              | Investigation                              | Resolution                          |
| ---------------------------------- | ------------------------------------------ | ----------------------------------- |
| High Error Rate                    | Check Sentry errors, review recent deploys | Rollback if needed, fix code        |
| Slow Queries                       | Run EXPLAIN on slow queries                | Check indexes, add if needed        |
| Rate Limiting Blocking Legit Users | Check rate limit logs                      | Adjust limits, whitelist if needed  |
| Auth Failures                      | Check JWT issues                           | Verify JWT_SECRET, rotate if needed |
| Payment Failures                   | Check Stripe webhook logs                  | Retry webhook, verify configuration |

### Phase 4: Recovery & Validation

```bash
# 1. Verify service is healthy
curl -v https://api.infamous-freight.com/api/health/detailed

# 2. Run health checks
pnpm test:e2e --grep "critical"

# 3. Monitor metrics for 30 mins
# - Error rate should drop to <0.1%
# - Response times back to baseline
# - No new alerts

# 4. Post-incident update
# - Document timeline
# - List root causes
# - Assign action items
```

## Common Issues & Quick Fixes

### Issue: High CPU Usage

```bash
# Identify the culprit
flyctl logs -a infamous-freight-api | grep CPU

# Possible causes:
# 1. Infinite loop in code
# 2. Memory leak (gradual)
# 3. Queue processing backlog

# Quick fix:
# 1. Scale up instances temporarily
flyctl scale count web=3 -a infamous-freight-api

# 2. Investigate logs
# 3. Rollback if caused by recent deploy
```

### Issue: Database Disk Space Full

```bash
# Check usage
SELECT pg_size_pretty(pg_database_size('infamous_freight'));

# Cleanup options:
# 1. Archive old data
DELETE FROM ai_events WHERE createdAt < NOW() - INTERVAL '90 days';

# 2. Vacuum to reclaim space
VACUUM ANALYZE;

# 3. Add more storage
# Contact cloud provider
```

### Issue: Memory Leak in API

```bash
# Signs:
# - Memory usage grows over time
# - Eventually crashes

# Debug:
# 1. Enable heap snapshots
# 2. Look for unclosed connections/streams
# 3. Check for circular references

# Quick fix:
# 1. Scale to multiple instances (load balance)
# 2. Set pod restart policy
flyctl scale vm shared-cpu-2x -a infamous-freight-api

# 3. Implement memory limits
```

### Issue: Rate Limiting Too Strict

```bash
# If legitimate users blocked:
# 1. Check rate limit config
cat $RATE_LIMIT_GENERAL_MAX
cat $RATE_LIMIT_AUTH_MAX

# 2. Temporarily increase
flyctl secrets set RATE_LIMIT_GENERAL_MAX=500 \
  -a infamous-freight-api

# 3. Monitor and adjust
# 4. Investigate actual load
```

## Communication Template

### Initial Alert

```
INCIDENT: [Service] - [Brief description]
Severity: [Critical/High/Medium/Low]
Impact: [Users affected, functionality impact]
ETA: [Time estimate for resolution]
Status: [Investigating/Stabilizing/Monitoring/Resolved]
```

### Status Update (Every 15 mins)

```
Status: [Latest status]
Actions Taken: [List of troubleshooting steps]
Next Steps: [What we're doing next]
ETA: [Revised time estimate]
```

### Post-Incident

```
Timeline:
- [Time] Incident detected
- [Time] Root cause identified
- [Time] Mitigation applied
- [Time] Service recovered
- [Time] Verification complete

Root Cause: [What actually caused it]
Impact: [How many users, for how long]
Action Items:
- [Prevention measure 1]
- [Prevention measure 2]
```

## Prevention

### Weekly Health Checks

```bash
# Run these to catch issues early
pnpm test:performance
pnpm test:e2e
curl $API_BASE/api/health/detailed

# Review metrics
# - Error rates
# - Response times
# - Database query times
# - Rate limit hits
```

### Monthly Reviews

- Database maintenance (VACUUM, ANALYZE)
- Log rotation and cleanup
- Dependency security updates
- Backup verification
- Disaster recovery drill

---

## Escalation Path

1. On-call engineer investigates (15 mins)
2. Escalate to tech lead if unresolved (20 mins)
3. Escalate to CTO if still unresolved (30 mins)
4. Customer communication if ETA > 1 hour

## Post-Mortem Template

- What happened?
- Timeline of events
- Impact assessment
- Root cause
- Remediation steps
- Prevention plan
- Owner + Due date
