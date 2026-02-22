# Operations Runbook & Dependency Management

**Last Updated**: February 22, 2026  
**Version**: 1.0  
**Audience**: DevOps, Operations, Backend Engineers

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Dependency Management](#dependency-management)
3. [Deployment Procedures](#deployment-procedures)
4. [Incident Escalation](#incident-escalation)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Node.js 20.11.1+
- pnpm 9.15.0+
- Docker (for local development)
- PostgreSQL 15+ (via Docker)

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight-enterprises

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Start dev services
pnpm dev           # All services
pnpm api:dev       # API only (port 3001 via Docker, 4000 standalone)
pnpm web:dev       # Web only (port 3000)
```

### Verify System Health
```bash
# Check API health
curl http://localhost:4000/api/health

# Run linting
pnpm lint

# Run tests (100% pass rate expected)
pnpm test

# Type checking
pnpm check:types
```

---

## Dependency Management

### Weekly Audit Process

**Every Monday morning - Run full audit**:
```bash
cd /workspaces/Infamous-freight-enterprises

# Comprehensive vulnerability scan
pnpm audit --audit-level=high

# Check for outdated packages
pnpm outdated

# Review lockfile changes
git diff pnpm-lock.yaml
```

**Action Thresholds**:
- 🔴 CRITICAL: Fix within 24 hours
- 🟠 HIGH: Fix within 1 week  
- 🟡 MODERATE: Fix within 2 weeks
- 🟢 LOW: Fix within 30 days

### Known Vulnerabilities (As of Feb 22, 2026)

#### CRITICAL: fast-xml-parser (aws-sdk)
- **Current Status**: Awaiting AWS SDK team fix
- **Monitoring**: Check AWS SDK releases weekly
- **Contact**: AWS Security team (tracked in incident #VULN-001)
- **Workaround**: Input validation on all S3 responses (deployed)

#### HIGH: React Native 0.73.4 Chain (13 vulnerabilities)
- **Current Status**: Blocked on React Native 0.74+ availability
- **Plan**: Q1 2026 planning, Q2 2026 implementation
- **Owners**: Mobile team lead + DevOps
- **Milestone Tracking**: See [VULNERABILITY-AUDIT-REPORT.md](VULNERABILITY-AUDIT-REPORT.md)

### Updating Core Dependencies

**Before Any Update**:
1. Create feature branch: `chore/update-{package}-{version}`
2. Review changelog: Check breaking changes
3. Update in package.json
4. Run: `pnpm install` (generates new pnpm-lock.yaml)
5. Verify: `pnpm lint && pnpm test && pnpm build`
6. Test on staging first

**Common Update Scenarios**:

#### Updating axios (HTTP client)
```bash
# Bump to latest minor
pnpm update axios@latest

# Run tests
pnpm test

# Commit with message
git commit -am "chore(deps): update axios to 1.13.5"
```

#### Updating Firebase
```bash
# Note: Mobile + Web share Firebase
pnpm --filter api update firebase
pnpm --filter web update firebase
pnpm --filter '@infamous-freight/shared' update firebase

# Regenerate types
pnpm check:types

# Test Firebase auth flows
pnpm test -- --grep="firebase|auth"

# Commit
git commit -am "chore(deps): update firebase to latest"
```

#### Updating @aws-sdk/* packages
```bash
# Update all AWS SDK packages together
pnpm update @aws-sdk/client-s3 @aws-sdk/client-ses @aws-sdk/s3-request-presigner

# Verify XML parsing still works (critical XXE vector)
pnpm test -- --grep="billing|s3"

# Commit
git commit -am "chore(deps): update aws-sdk packages"
```

### Shared Package Rebuilds

**Important**: Whenever `packages/shared/src` is modified:
```bash
# Rebuild shared package
pnpm --filter '@infamous-freight/shared' build

# Verify exports
pnpm check:types

# Restart dev services
pnpm dev
```

**Why**: All apps import types from shared. Stale builds cause TypeScript errors.

### pnpm Lock File Management

**Never manually edit `pnpm-lock.yaml`**

**If lock file is corrupted**:
```bash
# Remove lock file and node_modules
rm pnpm-lock.yaml
rm -rf node_modules
pnpm install --frozen-lockfile=false

# Commit only if legitimate update
git commit -am "chore: regenerate pnpm lock file"
```

**When reviewing PRs with lock changes**:
```bash
# Clean install with new lock file
pnpm install --frozen-lockfile

# Verify everything still works
pnpm lint && pnpm test && pnpm build
```

---

## Deployment Procedures

### Pre-Deployment Checklist

**24 hours before deployment**:
- [ ] All tests passing: `pnpm test` (expect 5/5 passing)
- [ ] Linting clean: `pnpm lint` (expect 0 errors)
- [ ] Types compile: `pnpm check:types` (expect 0 errors)
- [ ] Audit clean: `pnpm audit --audit-level=high` (known issues documented)
- [ ] Build succeeds: `pnpm build` (all packages compile)
- [ ] Git history clean: `git log --oneline -10` (conventional format)
- [ ] Database migrations ready: `cd apps/api && pnpm prisma:status`
- [ ] Environment variables reviewed: Compare `.env.production` against `.env.example`

### Deploy to Staging

**Staging URL**: staging.infamous-freight.app  
**Environment**: Docker Compose on staging server

```bash
# 1. SSH to staging server
ssh ops@staging.infamous-freight.app

# 2. Pull latest code
cd /app && git pull origin main

# 3. Install dependencies
pnpm install --frozen-lockfile

# 4. Run database migrations
cd apps/api && pnpm prisma:migrate:deploy

# 5. Build application
cd /app && pnpm build

# 6. Restart services (Docker Compose)
docker-compose -f docker-compose.staging.yml up -d

# 7. Verify health
curl http://localhost:4000/api/health
curl http://localhost:3000/health

# 8. Run smoke tests
pnpm run e2e:staging
```

**Staging Validation** (30 minutes):
- API endpoint response times < 200ms
- Web page load times < 2s
- Firebase auth flows working
- S3 upload/download working (exercises XXE vector)
- Payment processing flows working
- No errors in Sentry during smoke test

### Deploy to Production

**Production URL**: app.infamous-freight.com  
**Approval Required**: DevOps Lead + Security Review

```bash
# 1. Tag release
git tag -a v1.2.3 -m "Release 1.2.3 - Feb 22 2026"
git push origin v1.2.3

# 2. SSH to production server
ssh ops@app.infamous-freight.com

# 3. Backup current state
database-backup.sh
docker-compose -f docker-compose.production.yml stop
tar -czf /backups/app-backup-$(date +%s).tar.gz /app

# 4. Deploy new version
cd /app && git checkout v1.2.3
pnpm install --frozen-lockfile
cd apps/api && pnpm prisma:migrate:deploy
cd /app && pnpm build

# 5. Restart with rolling deployment
docker-compose -f docker-compose.production.yml up -d

# 6. Monitor for 30 minutes
watch 'curl http://localhost:4000/api/health && curl http://localhost:3000/health'
tail -f /var/log/app/error.log
```

**Post-Deployment** (Critical):
- [ ] Monitor error rates (should be baseline)
- [ ] Check API response times
- [ ] Verify Firebase connectivity
- [ ] Monitor S3 operations (XXE vector)
- [ ] Confirm email delivery (billing notifications)
- [ ] Review Sentry for new patterns

### Rollback Procedure

**If issues detected within 1 hour of deployment**:

```bash
# 1. Alert team immediately
# Trigger: Error rate > 5%, response time > 1s, health check fails

# 2. Revert to previous version
cd /app
git checkout HEAD~1
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --no-deps --build api web

# 3. Verify health
curl http://localhost:4000/api/health

# 4. Document in incident report
# File: /var/log/incidents/INCIDENT-{timestamp}.md
```

---

## Incident Escalation

### Communication Chain

1. **Detection** → Check Sentry, CloudWatch, uptime monitor
2. **Level 1 Alert** → Slack #incidents channel
   - Message: `@oncall [SEVERITY] Issue: {description}`
   - Attach: Error traces, affected users (if any)
3. **Page On-Call** → If CRITICAL or P1
   - PagerDuty escalation policy
4. **War Room** → If affecting paying customers
   - Join: zoom.us/j/incidents
   - Slack thread: Keep updates in #incidents

### Severity Levels

| Level        | Response Time | Examples                                                    |
| ------------ | ------------- | ----------------------------------------------------------- |
| CRITICAL (🔴) | 5 min         | Total API outage, data loss, payment failure                |
| P1 (🟠)       | 15 min        | Service degradation, auth broken, XXE exploitation detected |
| P2 (🟡)       | 1 hour        | Feature broken, performance issue, advisory vulnerability   |
| P3 (🟢)       | 4 hours       | Minor bugs, documentation needed, low-priority updates      |

### Incident Response

**For each incident**:
1. Create incident ticket (Jira/GitHub)
2. Document timeline in Slack thread
3. Assign root cause analysis
4. Create follow-up tasks to prevent recurrence
5. Post-mortem meeting within 24 hours

**CRITICAL Incident Template**:
```markdown
## Incident: [Title]
- **Severity**: CRITICAL
- **Duration**: Start - End time
- **Impact**: [# users affected, revenue impact]
- **Root Cause**: [What happened]
- **Resolution**: [How we fixed it]
- **Prevention**: [How we prevent next time]
- **Ticket**: [Link to Jira/GitHub]
- **Post-Mortem**: [Scheduled for DATE]
```

---

## Monitoring & Alerting

### Key Metrics

#### API Performance
- Response time P50, P95, P99 (target: <100ms P50, <500ms P95)
- Request volume
- Error rate (4xx, 5xx)
- Database query time

#### Web Performance
- First Contentful Paint (FCP) - target < 1.5s
- Largest Contentful Paint (LCP) - target < 2.5s
- Cumulative Layout Shift (CLS) - target < 0.1
- Time to Interactive (TTI) - target < 3.5s

#### System Health
- API uptime (target: 99.9%)
- Database connection pool usage
- Memory/CPU utilization
- Disk space

### Monitoring Tools

```bash
# View API logs
docker logs -f app-api-1

# Monitor database
docker exec -it app-db-1 psql -U app -d app -c "SELECT * FROM pg_stat_statements;"

# Check disk usage
df -h | grep app

# View error summary
curl http://localhost:4000/api/health?verbose=true
```

### Alerting Rules (Recommended for Datadog/New Relic)

1. **API Error Rate > 5%** → Page on-call (CRITICAL)
2. **Response Time P95 > 1s** → Alert to Slack (P1)
3. **Database connection pool > 80%** → Alert to Slack (P1)
4. **Error: XXE detection** → Page on-call immediately (CRITICAL)
5. **JWT parse failures > 10/min** → Alert to Slack (P1)
6. **Memory usage > 80%** → Alert to Slack (P2)

---

## Troubleshooting

### API Won't Start

**Symptom**: `Error: Cannot connect to database`

```bash
# 1. Check database status
docker-compose ps

# 2. Verify database is running
docker logs app-db-1

# 3. Check credentials in .env
grep DATABASE_URL .env

# 4. Manual database connection test
docker exec -it app-db-1 psql -U app -d app -c "SELECT 1;"

# 5. If failed, restart database
docker-compose down app-db-1
docker-compose up -d app-db-1
sleep 5
docker-compose up app-api-1
```

**Symptom**: `Error: Module not found @infamous-freight/shared`

```bash
# Rebuild shared package
pnpm --filter '@infamous-freight/shared' build

# Reinstall
pnpm install

# Restart
pnpm api:dev
```

### Tests Failing

**Symptom**: `5/5 PASS rate drops below 100%`

```bash
# 1. Check which test failed
pnpm test -- --reporter=verbose

# 2. Examine error
# If it's security test failure, likely external service down

# 3. Check Firebase connectivity
curl https://firebase.google.com

# 4. Check AWS connectivity
aws s3 ls --endpoint-url=$AWS_S3_ENDPOINT

# 5. If services down, update test skip conditions
```

### Slow Query Performance

**Symptom**: `API response time > 500ms`

```bash
# 1. Enable query logging
export LOG_LEVEL=debug

# 2. Run slow query
curl http://localhost:4000/api/shipments?skip=0&take=100

# 3. Check database stats
docker exec -it app-db-1 psql -U app -d app << EOF
SELECT query, calls, mean_time FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;
EOF

# 4. Check for missing indexes
pnpm prisma:studio

# 5. Create index if needed
# Edit apps/api/prisma/schema.prisma, then:
cd apps/api && pnpm prisma:migrate:dev --name add_index_name
```

### Out of Memory

**Symptom**: `JavaScript heap out of memory`

```bash
# 1. Check Node memory limit
node -e "console.log(require('v8').getHeapSpaceStatistics())"

# 2. Increase Node heap
export NODE_OPTIONS="--max-old-space-size=2048"

# 3. Kill old processes
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# 4. Restart
pnpm dev
```

---

## Contact & Escalation

- **DevOps Lead**: alerts-devops@infamous-freight.com
- **Security**: security@infamousfreight.com
- **On-Call**: See PagerDuty schedule
- **War Room**: zoom.us/j/incidents (bookmark it!)

---

**Last Updated**: February 22, 2026  
**Next Review**: May 22, 2026  
**Version**: 1.0
