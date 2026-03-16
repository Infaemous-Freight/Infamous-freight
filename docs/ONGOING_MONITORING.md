# Ongoing Monitoring & Maintenance Guide

This guide documents the continuous monitoring and maintenance procedures for
the Infæmous Freight Enterprises platform. Success requires consistent attention
to code quality, security, and performance metrics.

## Overview

Effective ongoing monitoring ensures early detection of issues, prevents
technical debt accumulation, and maintains system reliability. This guide
provides actionable procedures for daily, weekly, and monthly tasks.

## Strategic Monitoring Cadence

Use the following fixed cadence for market and business monitoring:

| Task | Frequency | Time |
| --- | --- | --- |
| Monitor freight industry news | Daily | 8:00 AM |
| Check platform reliability and incidents | Daily | 9:00 AM |
| Watch competitor funding and launches | Daily | 12:00 PM |
| Monitor trucking and brokerage regulations | Weekly (Monday) | 7:30 AM |
| Review Infæmous Freight revenue engine | Weekly (Friday) | 4:00 PM |

## Minimum Ops Stack (Locked)

- **Central Logs**: API request + error logs
- **Error Tracking**: Sentry-class tool
- **Cost Visibility**: AI usage aggregated per company/month
- **Audit Logs**: Immutable audit logs for operations and AI actions

**Internal Rule**: If you can’t see it, you can’t scale it.

---

## Daily Tasks (5-10 minutes)

### 1. Check Deployment Status

```bash
# Verify latest deployment succeeded
git log --oneline -3

# Check GitHub Actions status
# Go to: https://github.com/MrMiless44/Infamous-freight-enterprises/actions

# Verify API health endpoint
curl https://api.infamous-freight.com/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-12-13T10:30:00Z"
# }
```

### 2. Review Error Logs

```bash
# Check Sentry for new errors (5-10 new errors per day is normal)
# https://sentry.io → Infæmous Freight Project

# Look for:
# - Critical or Fatal errors (address immediately)
# - Repeated error patterns (investigate root cause)
# - New error types (assess severity)
```

### 3. Monitor Server Health

```bash
# Check server CPU and memory usage
# For Render: https://dashboard.render.com → Infrastructure
# For Fly.io: fly status
# For Vercel: https://vercel.com/dashboard

# Expected:
# - CPU: < 50% average
# - Memory: < 70% average
# - Disk: < 80% used
```

---

## Weekly Tasks (1-2 hours)

### 1. Review Code Coverage Reports

**Access Codecov Dashboard:**

```
https://app.codecov.io/gh/MrMiless44/Infamous-freight-enterprises
```

**What to review:**

```
📊 Overall Coverage
├── apps/api/          60% (target: 70%)
├── apps/web/          55% (target: 70%)
└── Status        Coverage has declined

🔍 Uncovered Files
├── apps/api/services/ ← Usually needs better coverage
└── apps/web/hooks/    ← Hook testing is important

📈 Coverage Trends
├── Last week:    58%
├── This week:    60%
└── Trend:        ↑ Improving (good!)
```

**Action Items:**

```
1. If coverage decreased > 5%:
   - Investigate which files lost coverage
   - Review associated pull requests
   - Ask reviewers to require coverage improvements

2. If any package below 50%:
   - Create ticket to improve coverage
   - Add testing to next sprint
   - Document untested code with comments

3. Regular maintenance:
   - Celebrate coverage improvements
   - Share win with team
```

**Add Missing Tests Example:**

```bash
# Identify uncovered file
# In Codecov, click on apps/api/services/billing.js

# See uncovered lines (shown in red)
# Write tests for those lines

npm test -- apps/api/__tests__/billing.test.js
npm test -- --coverage  # Verify improvement
```

### 2. Review and Merge Dependabot PRs

**Process:**

```bash
# Go to: https://github.com/MrMiless44/Infamous-freight-enterprises/pulls
# Filter by: is:open label:dependencies

# For each PR:

1. Review Dependabot summary
   - Dependency name and version change
   - Breaking changes (marked with 🚨)
   - Changelog preview

2. Check if CI/CD passes
   - All checks must be ✅ green
   - If failing, investigate why
   - May need to regenerate lock files

3. Test locally (for major versions)
   cd apps/api
   npm install
   npm test
   npm run lint

4. Merge if all clear
   # Click "Squash and merge"
   # Or use CLI:
   git checkout <branch>
   git merge main
   git push

5. Monitor after merge
   - Watch for new errors in Sentry
   - Check for performance regressions
```

**Typical Schedule:**

```
Monday:   Review npm packages (api, web, root)
Tuesday:  Review Python packages (if any)
Wednesday: Review Docker base images
Thursday:  Merge approved PRs
Friday:    Final security audit
```

### 3. Analyze Performance Metrics

**API Performance:**

```bash
# SSH to your server
ssh app@api.infamous-freight.com

# Check recent error rates
tail -100 /var/log/infamous-freight-api.log | grep ERROR | wc -l

# Expected: < 5 errors per hour
# If higher: investigate in Sentry

# Check response times
tail -1000 /var/log/infamous-freight-api.log | \
  grep "POST /api" | \
  awk '{print $NF}' | \
  sort -n | tail -1
# Expected: < 500ms for 99th percentile
```

**Web Performance:**

```bash
# Check Core Web Vitals
# https://web.dev/measure → Enter URL: https://infamous-freight.com

# Key metrics to track:
# LCP (Largest Contentful Paint): < 2.5s ✅
# FID (First Input Delay): < 100ms ✅
# CLS (Cumulative Layout Shift): < 0.1 ✅

# If any metric is red:
# 1. Identify bottleneck image/script
# 2. Create performance ticket
# 3. Optimize in next sprint
```

**Database Performance:**

```bash
# Connect to database
psql $DATABASE_URL

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- 100ms threshold
ORDER BY mean_exec_time DESC LIMIT 5;

-- Reset statistics
SELECT pg_stat_statements_reset();

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### 4. Security Audit

**Check for known vulnerabilities:**

```bash
# Run npm audit across all packages
cd apps/api && npm audit --audit-level=moderate
cd ../apps/web && npm audit --audit-level=moderate

# Review any vulnerabilities
# Expected: 0 vulnerabilities (Dependabot prevents this)

# Check GitHub Security tab
# https://github.com/MrMiless44/Infamous-freight-enterprises/security

# Expected items:
# ✅ Dependabot alerts: all dismissed or merged
# ✅ Secret scanning: all archived or false positive
# ✅ Code scanning: < 5 issues (preferably 0)
```

**Check SSL Certificate:**

```bash
# Verify HTTPS is working
curl -I https://api.infamous-freight.com
# Should see: HTTP/2 200

# Check certificate expiration
echo | openssl s_client -servername api.infamous-freight.com \
  -connect api.infamous-freight.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Expected: notAfter > 30 days in future
# If < 30 days: renew certificate immediately
```

---

## Monthly Tasks (2-4 hours)

### 1. Code Quality Review

**ESLint Issues:**

```bash
# Check lint violations
npm run lint 2>&1 | grep -E "error|warning" | wc -l

# Expected: 0 errors, < 10 warnings

# Fix automatically
npm run lint:fix

# Review complex warnings
npm run lint 2>&1 | head -20
```

**Test Coverage Analysis:**

```bash
# Generate detailed coverage report
npm test -- --coverage --verbose

# Identify files with < 50% coverage
# Create tickets to improve them

# Track trends
# Week 1: 55%
# Week 2: 57%
# Week 3: 60%  ← Trending up is good!
```

**Architecture Review:**

```bash
# Identify circular dependencies
npm install -g circular-dependency-check
circular-dependency-check ./dist/

# Check module sizes
npm install -g size-limit
size-limit

# If API > 50KB or Web > 200KB:
# 1. Identify large dependencies
# 2. Consider alternatives
# 3. Use dynamic imports
```

### 2. Security Audit

**Container Image Scanning:**

```bash
# Scan Docker images for vulnerabilities
docker scan infamous-freight-api:latest

# Check base image for updates
docker pull node:22-alpine
# Compare with current base image

# If vulnerabilities found:
# 1. Update Dockerfile
# 2. Rebuild image
# 3. Re-scan
# 4. Redeploy if critical
```

**API Security Check:**

```bash
# Test for common vulnerabilities
# Using OWASP Top 10 checklist

curl -I https://api.infamous-freight.com

# Check headers:
# ✅ Strict-Transport-Security: max-age=31536000
# ✅ X-Content-Type-Options: nosniff
# ✅ X-Frame-Options: DENY
# ✅ Content-Security-Policy: ...
```

### 3. Database Health Check

**Run maintenance tasks:**

```bash
psql $DATABASE_URL << EOF

-- Analyze query performance
ANALYZE;

-- Reclaim disk space
VACUUM FULL;

-- Reindex tables
REINDEX DATABASE infamous_freight;

-- Check for unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(relid) DESC;

-- Check table health
SELECT schemaname, tablename,
  round(100.0*live_tuples/(live_tuples+dead_tuples)) AS ratio
FROM pg_stat_user_tables
WHERE (live_tuples + dead_tuples) > 0
ORDER BY ratio ASC;
EOF
```

**Backup Verification:**

```bash
# List recent backups
ls -lhS /backups/ | head -10

# Expected: Daily backups, each > 10MB
# Oldest backup should be < 30 days

# Test restore (monthly, on staging)
pg_restore -d infamous_freight_test \
  /backups/backup_latest.dump

# Verify data integrity
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM orders;
# Compare with production counts
```

### 4. Team Review Meeting (30 min)

**Weekly Standup Agenda:**

```markdown
## Infæmous Freight - Weekly Review

📊 **Metrics**

- Coverage: 60% (was 58%)
- Error rate: 0.5% (was 1.2%)
- Uptime: 99.95%
- Performance: OK

🔒 **Security**

- Dependabot: 5 PRs merged
- Vulnerabilities: 0 active
- Secrets: All clear

🐛 **Issues**

- Issue #145: Slow API response (in progress)
- Issue #156: High memory usage (assigned)

📝 **Upcoming**

- Deploy payment reconciliation (next week)
- Migrate to PostgreSQL 15 (planning)

👥 **Team**

- All hands present
- No blockers
```

---

## Incident Response Procedures

### Low Severity (Doesn't affect users)

**Example:** Code coverage dropped to 50%

```
1. Create GitHub issue
2. Assign to developer
3. Schedule for next sprint
4. No urgent action needed
```

### Medium Severity (Affects some users)

**Example:** API response time > 2 seconds

```
1. Page on-call engineer
2. Investigate root cause
   - Check Sentry for errors
   - Review recent deployments
   - Check database performance
3. Implement temporary fix if needed
4. Create issue for permanent solution
5. Document in incident report
```

### Critical Severity (Affects all users)

**Example:** API is down or returning errors

```
1. Page on-call engineer immediately
2. Execute incident playbook:
   a. Stop bleeding (switch to fallback if available)
   b. Investigate cause (last 5 mins of logs)
   c. Implement fix (rollback or hotfix)
   d. Verify recovery (health checks passing)
   e. Document timeline

3. Post-incident review (within 24 hours)
   - What went wrong?
   - Why didn't we catch it?
   - How do we prevent it?
```

---

## Monitoring Tools Setup

### Sentry (Error Tracking)

**Setup:**

```
1. Go to https://sentry.io
2. Sign in → Infæmous Freight project
3. Set alerts:
   - All critical errors → Slack #alerts
   - Error rate > 1% → Slack #alerts
   - New release → Slack #deployments

4. Configure in .env:
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Daily Review:**

```
- Check for spikes in error volume
- Investigate new error types
- Review error resolution status
```

### Codecov (Coverage Tracking)

**Setup:**

```
1. Go to https://codecov.io
2. Sign in → Infæmous Freight project
3. Set pull request settings:
   - Require 70% project coverage
   - Require 80% patch coverage
   - Comment on every PR
```

**Weekly Review:**

```
- Track coverage trends
- Identify uncovered files
- Celebrate improvements
```

### GitHub Actions (CI/CD)

**Monitor:**

```
1. Go to: https://github.com/MrMiless44/Infamous-freight-enterprises/actions
2. Check for failed workflows
3. Expected: All recent runs passing
4. If failure: investigate and fix immediately
```

### Uptime Monitoring

**Setup (recommended):**

```
Services to monitor:
- https://api.infamous-freight.com/health (every 60s)
- https://infamous-freight.com (every 60s)
- Database connectivity (every 300s)

Recommended tools:
- Uptime Robot (free)
- DataDog
- New Relic
- Cloudflare
```

---

## Checklists

### Daily Checklist (5 min)

```
□ API health check passing
□ No critical errors in Sentry
□ All GitHub Actions passing
□ Slack notifications reviewed
```

### Weekly Checklist (2 hours)

```
□ Code coverage reviewed
□ Dependabot PRs merged
□ Performance metrics checked
□ Security vulnerabilities addressed
□ Database performance OK
□ Team sync completed
```

### Monthly Checklist (4 hours)

```
□ Full code quality audit
□ Container images scanned
□ Database maintenance run
□ Backups verified
□ SSL certificate valid
□ Architecture review done
□ Team retrospective held
□ Metrics trending report created
```

### Quarterly Checklist (1 day)

```
□ Security audit (external or internal)
□ Load testing performed
□ Disaster recovery plan updated
□ Documentation reviewed
□ Team training sessions held
□ Vendor reviews (providers, tools)
□ Architecture improvements planned
□ Budget and cost optimization
```

---

## Escalation Path

**Level 1: Developer (5-15 min response)**

- Triage and investigate
- Attempt quick fix
- Document findings

**Level 2: Tech Lead (15-30 min response)**

- If Level 1 can't resolve
- Mobilize additional developers
- Make architectural decisions

**Level 3: Engineering Manager (30+ min response)**

- For critical incidents
- Customer communication
- Post-incident review

---

## Documentation & References

- [Sentry Documentation](https://docs.sentry.io/)
- [Codecov Documentation](https://docs.codecov.io/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Key Contacts

```
On-Call Engineer: [Your Name]
Tech Lead: [Name]
Engineering Manager: [Name]
DevOps Contact: [Name]

Escalation: Slack #eng-incidents
```

---

**Last Updated:** December 13, 2025  
**Maintained By:** Development Team  
**Review Frequency:** Monthly  
**Next Review:** January 13, 2026
