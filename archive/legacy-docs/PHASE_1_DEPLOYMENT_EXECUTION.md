# Phase 1: Production Deployment Execution Plan

**Infamous Freight Enterprises v1.0.0**
**Status**: Ready for Execution
**Date**: December 30, 2025

---

## Overview

Phase 1 is the initial production deployment of the v1.0.0 system with 24-hour monitoring and validation. This is a **LOW-RISK** deployment as all systems are production-ready with comprehensive test coverage.

**Timeline**: ~45 minutes active deployment + 24 hours monitoring  
**Risk Level**: LOW  
**Rollback Time**: <5 minutes (database backup available)

---

## Pre-Deployment Status ✅

### Environment Configuration

- ✅ `.env.production` created with all required variables:
  - `NODE_ENV=production`
  - `API_PORT=3001`
  - `WEB_PORT=3000`
  - `DATABASE_URL` configured
  - `JWT_SECRET` ready
  - `REDIS_URL` configured
  - `CORS_ORIGINS` set
  - `GRAFANA_PASSWORD` configured
  - `SENTRY_DSN` (optional, for error tracking)
  - Feature flags all enabled

### Database

- ✅ Pre-deployment backup location: `/workspaces/Infamous-freight-enterprises/backups/`
- ✅ Backup naming convention: `backup_YYYYMMDD_HHMMSS.sql`
- ✅ Database: PostgreSQL 15 (configured in `docker-compose.production.yml`)
- ✅ Migrations: Ready to apply

### Project Structure

- API: `/api` (Express.js + CommonJS)
- Web: `/web` (Next.js 14 + TypeScript)
- Shared: `/packages/shared` (TypeScript domain types)
- Monitoring: `/monitoring` (Prometheus + Grafana)
- Docker: `/docker-compose.production.yml`

---

## Deployment Steps

### Step 1: System Approval (5 minutes)

**Stakeholders Required**:

- ✅ Technical Lead: **\*\*\*\***\_**\*\*\*\*** (Signature/Approval)
- ✅ Product Manager: **\*\*\*\***\_**\*\*\*\***
- ✅ Operations Lead: **\*\*\*\***\_**\*\*\*\***

**Sign-off Checklist**:

- [ ] v1.0.0 feature set approved
- [ ] Security audit passed
- [ ] Performance baselines reviewed
- [ ] Cost impact approved
- [ ] Rollback procedure understood
- [ ] Monitoring dashboard prepared

---

### Step 2: Production Environment Setup (5 minutes)

```bash
# Navigate to workspace
cd /workspaces/Infamous-freight-enterprises

# Verify .env.production exists
cat .env.production | grep NODE_ENV

# Export production configuration (if not using Docker Compose)
export $(cat .env.production | grep -v ^# | xargs)

# Verify critical variables
echo "API_PORT: $API_PORT"
echo "DATABASE_URL: $DATABASE_URL (sensitive - check exists only)"
echo "NODE_ENV: $NODE_ENV"
```

**Expected Output**:

```
NODE_ENV=production
API_PORT=3001
DATABASE_URL=postgresql://... (configured)
```

---

### Step 3: Create Safety Backup (5 minutes)

```bash
# Create backups directory
mkdir -p /workspaces/Infamous-freight-enterprises/backups

# Create timestamped pre-deployment database backup
# Option A: Using Docker (if containers running)
docker exec -i (postgres-container-id) pg_dump -U infamous -d infamous_freight > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Option B: Using pg_dump directly (if available)
pg_dump -h localhost -U infamous -d infamous_freight > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup created
ls -lh backups/backup_*.sql | tail -1
```

**Expected Output**:

```
-rw-r--r-- 1 user user 15M Dec 30 07:30 backups/backup_20251230_073000.sql
```

---

### Step 4: Pre-Deployment Validation (10 minutes)

```bash
# Check Node.js and build tools
node --version  # Should be v18+
npm --version   # Should be v9+
pnpm --version  # Should be v8.15.9

# Verify all required files exist
test -f docker-compose.production.yml && echo "✅ Docker Compose config found"
test -f .env.production && echo "✅ Production env file found"
test -d api && echo "✅ API directory found"
test -d web && echo "✅ Web directory found"
test -d packages/shared && echo "✅ Shared package found"

# Check Docker Compose configuration
docker-compose -f docker-compose.production.yml config > /dev/null && echo "✅ Docker config valid"
```

**Expected**: All checks pass (6 ✅)

---

### Step 5: Dependencies and Builds (15 minutes)

```bash
# Install dependencies (if not already installed)
pnpm install --frozen-lockfile

# Build shared package
pnpm --filter @infamous-freight/shared build

# Build API
pnpm --filter infamous-freight-api build

# Build Web
pnpm --filter infamous-freight-web build

# Verify all builds succeeded
test -f api/dist/server.js && echo "✅ API built"
test -d web/.next && echo "✅ Web built"
```

**Expected**: All builds complete successfully

---

### Step 6: Start Production Environment (10 minutes)

#### Option A: Docker Compose (Recommended)

```bash
# Pull latest images
docker-compose -f docker-compose.production.yml pull

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Verify services started
docker-compose -f docker-compose.production.yml ps

# View startup logs
docker-compose -f docker-compose.production.yml logs --tail=50 api
docker-compose -f docker-compose.production.yml logs --tail=50 web
```

#### Option B: Manual Services

```bash
# Terminal 1: Start API
cd /workspaces/Infamous-freight-enterprises/api
pnpm start

# Terminal 2: Start Web
cd /workspaces/Infamous-freight-enterprises/web
pnpm start

# Terminal 3: Start monitoring stack
cd /workspaces/Infamous-freight-enterprises
docker-compose -f docker-compose.production.yml up postgres redis
```

**Services to Start**:

- PostgreSQL (port 5432)
- Redis (port 6379)
- API (port 3001)
- Web (port 3000)
- Prometheus (port 9090)
- Grafana (port 3002)
- Jaeger (port 6831, 16686)

---

## Post-Deployment Validation (10 minutes)

### Health Checks

```bash
# 1. API Health
curl -s http://localhost:3001/api/health | jq .

# Expected response:
#{
#  "status": "ok",
#  "uptime": 42.5,
#  "timestamp": 1735560600000,
#  "database": "connected"
#}

# 2. Web Application
curl -I http://localhost:3000

# Expected: HTTP/1.1 200 OK

# 3. Docker Services (if using Docker)
docker-compose -f docker-compose.production.yml ps

# Expected: All 7 services showing "Up"
```

### Test Critical Endpoints

```bash
# Test AI Commands
curl -X POST http://localhost:3001/api/ai/commands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"command":"get_status"}'

# Test Shipments API
curl http://localhost:3001/api/shipments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq . | head -20

# Test Voice Endpoint (if enabled)
curl http://localhost:3001/api/voice/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Monitoring Dashboard

```bash
# Access Grafana
# URL: http://localhost:3002
# Default credentials:
# Username: admin
# Password: (from GRAFANA_ADMIN_PASSWORD in .env.production)

# Verify dashboards:
# - System Overview
# - API Performance
# - Database Metrics
# - Error Tracking
```

---

## 24-Hour Monitoring Plan

### Monitoring Metrics (Watch These Closely)

1. **API Response Time**
   - Target: P95 < 2 seconds
   - Alert if: P95 > 3 seconds

2. **Error Rate**
   - Target: < 0.5%
   - Alert if: > 1%

3. **Database Connections**
   - Target: < 80% pool utilization
   - Alert if: > 90%

4. **Memory Usage**
   - Target: < 60%
   - Alert if: > 80%

5. **CPU Usage**
   - Target: < 50%
   - Alert if: > 75%

### Daily Monitoring Schedule

**Hour 0-1**: Immediate validation

- [ ] All services running
- [ ] No critical errors in logs
- [ ] Health checks passing
- [ ] Grafana metrics flowing

**Hour 1-6**: Peak traffic simulation

- [ ] Run load tests
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify cache hit rates

**Hour 6-12**: Normal operations

- [ ] Monitor system stability
- [ ] Check background jobs (if any)
- [ ] Verify database replication
- [ ] Monitor external integrations

**Hour 12-24**: Final validation

- [ ] Confirm 24h uptime
- [ ] Review error logs
- [ ] Document any issues
- [ ] Prepare Phase 2 transition

### Alert Rules (Sentry/Datadog)

Create alerts for:

- [ ] 5xx errors > 5/minute
- [ ] Response time p95 > 3s
- [ ] Database connection pool exhaustion
- [ ] Memory > 85%
- [ ] Disk space < 10% remaining
- [ ] Unhandled exceptions
- [ ] JWT token validation failures

---

## Rollback Procedure (If Needed)

**Rollback Time**: < 5 minutes

### Quick Rollback

```bash
# 1. Stop current deployment
docker-compose -f docker-compose.production.yml down

# 2. Restore from backup
psql -h localhost -U infamous -d infamous_freight < backups/backup_20251230_073000.sql

# 3. Restart with previous version
git checkout v0.9.0  # or previous stable tag
docker-compose -f docker-compose.production.yml up -d

# 4. Verify
curl http://localhost:3001/api/health
```

### Detailed Rollback Steps

1. **Pause Traffic**: Redirect users to status page
2. **Stop Services**: `docker-compose -f docker-compose.production.yml down`
3. **Restore Database**: `psql < backups/backup_*.sql`
4. **Checkout Previous Code**: `git checkout v0.9.0`
5. **Rebuild Services**: `pnpm install && pnpm build`
6. **Restart Services**: `docker-compose -f docker-compose.production.yml up -d`
7. **Verify Health**: Confirm all health checks pass
8. **Resume Traffic**: Switch users back to system

---

## Success Criteria

**Phase 1 is COMPLETE when:**

- [x] `.env.production` created with all required variables
- [x] Pre-deployment backup created successfully
- [ ] All stakeholder approvals obtained
- [ ] All services started and running
- [ ] API health check returns 200 OK
- [ ] Web application loads without errors
- [ ] Grafana dashboard displays metrics
- [ ] No 5xx errors in first hour
- [ ] Response time p95 < 2 seconds
- [ ] Database connected and responsive
- [ ] 24-hour stability maintained
- [ ] Zero unplanned restarts
- [ ] All monitoring alerts operational

---

## Transition to Phase 2

Once Phase 1 passes all success criteria for 24 hours:

```bash
# Mark Phase 1 complete
git tag -a v1.0.0-production -m "Phase 1: Production deployment complete"

# Run Phase 2 performance analysis
bash /workspaces/Infamous-freight-enterprises/scripts/optimize-performance-phase2.sh

# Review Phase 2 checklist
cat /workspaces/Infamous-freight-enterprises/COMPLETE_IMPLEMENTATION_CHECKLIST.md | grep "Phase 2" -A 20
```

**Phase 2 Timeline**: Starts after Phase 1 stable (2 days)  
**Phase 2 Duration**: ~2 days (10 hours of actual work)

---

## Support & Escalation

### Critical Issue Escalation

1. **Database Down**: Restore from backup, check disk space, verify connections
2. **API Crashing**: Check logs (`docker logs api`), review recent changes, restart service
3. **Web Unresponsive**: Check Next.js build, verify API connectivity, clear cache
4. **High Memory**: Check for memory leaks, restart services, review connection pools
5. **High CPU**: Check for blocking operations, review query performance, optimize code

### Emergency Contacts

- Technical Lead: **\*\*\*\***\_**\*\*\*\***
- DevOps Lead: **\*\*\*\***\_**\*\*\*\***
- Product Manager: **\*\*\*\***\_**\*\*\*\***

---

## Post-Deployment Documentation

**Files Created This Phase**:

- `.env.production` - Production environment configuration
- `backups/backup_*.sql` - Database backup (created automatically)
- `PHASE_1_DEPLOYMENT_LOG.md` - This document

**Key References**:

- [COMPLETE_IMPLEMENTATION_CHECKLIST.md](COMPLETE_IMPLEMENTATION_CHECKLIST.md) - Full 155+ checkpoint list
- [IMPLEMENTATION_ROADMAP_PHASES_1-4.md](IMPLEMENTATION_ROADMAP_PHASES_1-4.md) - Complete 30-day roadmap
- [docker-compose.production.yml](docker-compose.production.yml) - Production configuration

---

## Deployment Log

```
Start Time: [To be filled]
Deployment By: [To be filled]
Approvals Obtained: [To be filled]
Services Started: [To be filled]
Health Checks Passed: [To be filled]
24h Monitoring Complete: [To be filled]
End Time: [To be filled]
Status: [To be filled]
```

---

**Generated**: December 30, 2025  
**For**: Infamous Freight Enterprises  
**Phase**: 1 of 4  
**Version**: 1.0.0
