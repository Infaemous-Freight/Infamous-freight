# 🚨 Operations Runbook

**Infamous Freight Enterprises - Emergency & Operational Procedures**

Last Updated: February 19, 2026

---

## 🚨 EMERGENCY PROCEDURES

### 1. API Service is Down (Red Alert)

**Symptom**: `GET /api/health` returns 5xx or no response

**Timeline**: Response within 2 minutes

**Steps**:

```bash
# Step 1: Confirm service is down (30 seconds)
curl -v https://api.infamous.com/api/health
# Expected: 200 OK with { "status": "ok" }
# Actual: Connection refused or 5xx error

# Step 2: Check logs (1 minute)
flyctl logs --app infamous-freight-as-3gw --recent 50

# Step 3: Check resource usage
flyctl status --app infamous-freight-as-3gw
# Look for: CPU > 80%, Memory > 85%, Crashes

# Step 4: Restart the service
flyctl restart --app infamous-freight-as-3gw

# Step 5: Wait for recovery
sleep 10
curl -v https://api.infamous.com/api/health

# Step 6: If still not recovering → TRIGGER ROLLBACK
./scripts/rollback.sh production previous
```

**Escalation**: If API doesn't recover in 5 minutes → Page on-call engineer

---

### 2. Database Connection Failures

**Symptom**: Logs show "ECONNREFUSED" or "timeout awaiting connection"

**Timeline**: Response within 3 minutes

**Steps**:

```bash
# Step 1: Check database status
flyctl status --app infamous-freight-db

# Step 2: Check connection pool exhaustion
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity";

# Step 3: Kill idle connections (if needed)
psql $DATABASE_URL << EOF
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'infamous' AND state = 'idle';
EOF

# Step 4: Restart API to reset connection pool
flyctl restart --app infamous-freight-as-3gw

# Step 5: Verify database is responsive
psql $DATABASE_URL -c "SELECT 1";
```

**Root Causes**:
- Connection pool exhausted (increase pool size or restart)
- Database server down (check Postgres status)
- Network connectivity (check VPN/firewall)
- Slow queries locking tables (kill long-running queries)

---

### 3. High Error Rate (Alerts firing)

**Symptom**: Error rate > 5% or > 50 errors/minute

**Timeline**: Mitigate within 5 minutes

**Steps**:

```bash
# Step 1: Check error distribution
# In Sentry: Filters → Last 1 hour
# Common patterns?
# - 4xx (client errors) → usually not critical
# - 5xx (server errors) → requires attention
# - Specific endpoint affected?

# Step 2: Check recent deployments
git log --oneline -5

# Step 3: Check for rate limiting issues
curl -I https://api.infamous.com/api/shipments \
  -H "Authorization: Bearer test-token"
# Look for: X-RateLimit-Remaining

# Step 4: If deployment was recent → TRIGGER ROLLBACK
./scripts/rollback.sh production previous

# Step 5: If errors persist → Scale up
flyctl scale --app infamous-freight-as-3gw vm shared-cpu-1x:3
```

**Investigation**:
- Check what changed in last deploy
- Look for database query changes
- Check external service dependencies
- Review error messages in Sentry

---

### 4. Slow API Responses (Latency Alert)

**Symptom**: API P95 latency > 1s or P99 > 2s

**Timeline**: Optimize within 10 minutes

**Steps**:

```bash
# Step 1: Identify slow endpoints
# In Datadog/Sentry: Sort by duration
# Most common: /api/shipments, /api/users/{id}

# Step 2: Check database query logs
grep "duration.*ms" apps/api/logs/* | sort -t: -k2 -rn | head -20

# Step 3: Kill slow queries (if blocking)
psql $DATABASE_URL << EOF
SELECT pid, query, query_start 
FROM pg_stat_activity 
WHERE state != 'idle' AND query_start < now() - interval '5 seconds';

-- Kill specific query
SELECT pg_terminate_backend(<PID>);
EOF

# Step 4: Check for N+1 query patterns
# Look in Datadog: Count of similar queries from one user request

# Step 5: Restart API with query caching enabled
flyctl config set CACHE_TTL_SECONDS=300
flyctl restart
```

**Long-term fixes**:
- Add database indexes
- Optimize query with `include()` to prevent N+1
- Add response caching for GET endpoints
- Consider query result caching

---

### 5. Database Disk Space Alert

**Symptom**: Database storage > 90% capacity

**Timeline**: Resolve within 1 hour

**Steps**:

```bash
# Step 1: Check current usage
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('infamous'));"

# Step 2: Check table sizes
psql $DATABASE_URL -c "
  SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) 
  FROM pg_stat_user_tables 
  ORDER BY pg_total_relation_size(relid) DESC;
"

# Step 3: Archive old data if needed
# Example: Archive shipments older than 1 year
psql $DATABASE_URL << EOF
BEGIN;
INSERT INTO shipments_archive 
SELECT * FROM shipments WHERE created_at < now() - interval '1 year';
DELETE FROM shipments WHERE created_at < now() - interval '1 year';
COMMIT;
EOF

# Step 4: Vacuum and analyze
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Step 5: Upgrade database disk (if persistent)
# Contact Fly.io support or upgrade plan
```

---

### 6. Memory Leak Detected (Memory grows continuously)

**Symptom**: Memory usage grows 10MB/minute without decrease

**Timeline**: Resolve within 10 minutes

**Steps**:

```bash
# Step 1: Confirm memory leak
flyctl status --app infamous-freight-as-3gw
# Check memory trend

# Step 2: Check for unfinished streams/connections
# Look in logs for: "Stream leak detected" or unfinished responses

# Step 3: Restart service (temporary fix)
flyctl restart --app infamous-freight-as-3gw

# Step 4: Investigate root cause
# Common causes:
# - Cache growing unbounded → add TTL
# - Event listeners not cleaned up → add .off()
# - Logging too verbosely → reduce log level
# - Streams not closing → verify res.end()

# Step 5: Deploy fix
git commit -am "fix: prevent memory leak in [component]"
git push origin main
# Wait for deployment
```

---

## ✅ ROUTINE PROCEDURES

### Daily Monitoring (Start of Day)

```bash
#!/bin/bash
set -e

echo "📊 Daily Monitoring Check"

# Check uptime
echo "1. Checking API uptime..."
STATUS=$(curl -s https://api.infamous.com/api/health | jq -r '.status')
if [ "$STATUS" = "ok" ]; then
  echo "   ✅ API is up"
else
  echo "   ❌ API DOWN!"
  exit 1
fi

# Check error rate
echo "2. Checking error rate (Sentry)..."
# Manual check: https://sentry.io/organizations/infamous/issues/

# Check database status
echo "3. Checking database..."
CONN_COUNT=$(psql $DATABASE_URL -tc "SELECT count(*) FROM pg_stat_activity;" | tr -d ' ')
echo "   Active connections: $CONN_COUNT"

# Check recent logs
echo "4. Recent errors..."
flyctl logs --app infamous-freight-as-3gw --recent 20 | grep -i error || echo "   No errors ✅"

echo "✅ Daily check complete"
```

### Weekly Maintenance (Every Friday)

```bash
#!/bin/bash
set -e

echo "🔧 Weekly Maintenance"

# 1. Review code coverage
echo "1. Running tests..."
pnpm test:coverage

# 2. Update dependencies
echo "2. Checking for dependency updates..."
pnpm outdated

# 3. Update security patches
echo "3. Running security audit..."
nppm audit

# 4. Verify backups
echo "4. Verifying database backups..."
# Contact Fly.io to confirm backups

# 5. Test disaster recovery
echo "5. Testing disaster recovery procedure..."
# Run test rollback to staging

echo "✅ Weekly maintenance complete"
```

### Monthly Reviews (First Friday)

- **Security**: Review OWASP compliance checklist
- **Performance**: Analyze slow query logs
- **Reliability**: Review incident reports
- **Cost**: Check resource usage and bill
- **Dependencies**: Review and plan updates

---

## 📋 Checklists

### Pre-Deployment Checklist

- [ ] All tests passing (`pnpm test`)
- [ ] ESLint checks pass (`pnpm lint`)
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] No console errors in production build
- [ ] Database migrations reviewed
- [ ] Environment variables configured
- [ ] Secrets rotated (if changed)
- [ ] Team notified of deployment

### Post-Deployment Checklist

- [ ] API health check passes
- [ ] Web app loads without errors
- [ ] Key workflows tested manually
- [ ] Error rate normal (<1%)
- [ ] Performance metrics stable
- [ ] Deployed version matches git tag
- [ ] Release notes published
- [ ] Monitoring alerts active

---

## 📞 Escalation Path

| Severity                         | Owner            | Response Time  | Escalate After |
| -------------------------------- | ---------------- | -------------- | -------------- |
| Critical (all services down)     | On-call Engineer | 5 minutes      | 10 minutes     |
| High (partial degradation)       | Engineering Lead | 15 minutes     | 30 minutes     |
| Medium (performance degradation) | Senior Engineer  | 1 hour         | 2 hours        |
| Low (documentation, cleanup)     | Team             | 1 business day | N/A            |

---

## 🔗 Important Links

- **Status Page**: https://status.infamous.com
- **Sentry Errors**: https://sentry.io/organizations/infamous/issues/
- **Datadog Dashboard**: https://app.datadoghq.com/dashboard
- **Fly.io Console**: https://fly.io/apps/infamous-freight-as-3gw
- **GitHub**: https://github.com/MrMiless44/Infamous-freight
- **Slack Channel**: #incidents (or similar)

---

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [MONITORING.md](./MONITORING-AND-ALERTING-SETUP-RECOMMENDED.md) - Alerting setup
- [TROUBLESHOOTING.md](./TROUBLESHOOTING-GUIDE.md) - Common issues

---

**Last Updated**: February 19, 2026
**Next Review**: March 19, 2026
**Maintained By**: DevOps Team
