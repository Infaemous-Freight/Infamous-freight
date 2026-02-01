# Blue-Green Deployment Procedure Guide

## Step-by-Step Instructions for Infamous Freight Enterprises

Complete guide for performing zero-downtime deployments using blue-green strategy.

---

## Overview

**Blue-Green Deployment** means running two identical production environments:

- **Blue**: Current stable version (receiving traffic)
- **Green**: New version (being tested)

When green is verified, switch traffic instantly with zero downtime.

---

## Prerequisites

✅ Production stack running: `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`  
✅ Both `api-blue` and `api-green` services accessible  
✅ Nginx reverse proxy configured and running  
✅ Health check scripts available in `./scripts/`

---

## Phase 1: Preparation (Pre-Deployment)

### Step 1.1: Verify Current Status

```bash
# Check which version is currently active (blue)
./scripts/switch-deployment.sh status

# Output example:
# Current deployment: blue
# API at: api-blue:4000
# Services:
#   ✓ Blue:  Healthy
#   ✗ Green: Unhealthy
```

### Step 1.2: Verify Blue Health

```bash
# Run health check on blue
./scripts/switch-deployment.sh health-check

# Expected output:
# ✓ Blue is healthy
# ✗ Green is unhealthy (expected, not yet deployed)
```

### Step 1.3: Create Release Notes (Optional)

```bash
# Create deployment log
cat > deployment.log << EOF
=== Blue-Green Deployment Log ===
Date: $(date)
From Version: v1.0.0 (blue)
To Version: v1.1.0 (green)
Changes:
- Security patches
- Performance improvements
- Bug fixes
EOF
```

---

## Phase 2: Deploy New Version to Green

### Step 2.1: Pull New Image

```bash
# Get the new image (from GHCR)
docker pull ghcr.io/infamous-freight-enterprises/api:v1.1.0

# Tag it for use in docker-compose
docker tag ghcr.io/infamous-freight-enterprises/api:v1.1.0 \
  ghcr.io/infamous-freight-enterprises/api:latest
```

### Step 2.2: Deploy to Green Slot

```bash
# Start green environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d api-green

# Wait for green to be ready (30-60 seconds)
sleep 30

# Check green is running
docker-compose ps api-green
```

### Step 2.3: Verify Green Deployment

```bash
# Run comprehensive health check
curl -v http://api-green:4000/api/health

# Expected response (200 OK):
#{
#  "status": "healthy",
#  "uptime": 1234,
#  "services": {
#    "database": "connected",
#    "redis": "connected"
#  }
#}

# Check service health
docker-compose logs api-green | tail -20
```

### Step 2.4: Run Smoke Tests (Optional)

```bash
# Test critical API endpoints on green
curl http://api-green:4000/api/shipments -H "Authorization: Bearer $JWT_TOKEN"
curl http://api-green:4000/api/health/ready

# Verify database is accessible
docker-compose exec api-green node -e "require('./src/config/db').connect().then(() => console.log('✓ DB Connected')).catch(e => console.error('✗ DB Error:', e))"
```

### Step 2.5: Load Test (Optional)

```bash
# Run light load test on green (requires k6 or similar)
# This ensures green can handle production traffic
docker run --rm -v $PWD/tests:/scripts \
  grafana/k6 run /scripts/load-test.js \
  --vus 10 --duration 30s \
  --target-endpoint http://api-green:4000
```

---

## Phase 3: Traffic Switch (The Cutover)

### Step 3.1: Prepare for Switch

```bash
# Take timestamp for rollback if needed
SWITCH_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "Switch time: $SWITCH_TIME" >> deployment.log

# Create backup of nginx config
cp monitoring/nginx/conf.d/default.conf monitoring/nginx/conf.d/default.conf.backup-blue
```

### Step 3.2: Switch Traffic to Green

```bash
# Execute switch
./scripts/switch-deployment.sh green

# Expected output:
# 🔄 Switching to green deployment...
# 🏥 Checking health of green deployment...
# ✓ green is healthy
# ✓ Health check passed, proceeding with switch...
# ✓ Nginx reloaded with green
# ✓ Green deployment is healthy
# ✅ Successfully switched to green deployment
```

### Step 3.3: Verify Traffic on Green

```bash
# Confirm switch worked
./scripts/switch-deployment.sh status

# Expected: "Current deployment: green"

# Test API through nginx (public endpoint)
curl http://localhost:4000/api/health

# Should respond from GREEN now
```

### Step 3.4: Monitor Metrics

```bash
# Watch for error spikes
watch -n 1 'curl -s http://localhost:9090/api/v1/query?query=http_requests_total | jq'

# Check logs for errors
docker-compose logs api-green -f --tail 50

# Monitor CPU/Memory
docker stats api-green
```

---

## Phase 4: Verification (Post-Switch)

### Step 4.1: Run Health Checks (5 minutes)

```bash
# Run continuous monitoring
./scripts/healthcheck.sh --once

# Verify endpoints responding correctly
for i in {1..10}; do
  echo "Request $i..."
  curl -s http://localhost:4000/api/health | jq '.status'
  sleep 2
done
```

### Step 4.2: Check Application Logs

```bash
# Green logs should show normal operation
docker-compose logs api-green --tail 100 | grep -E "error|ERROR|Exception"

# Should return empty (no errors)
```

### Step 4.3: Verify Database Consistency

```bash
# Check database connections on green
docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Verify data integrity
docker-compose exec api-green npm run db:verify

# Check for replication lag (if applicable)
docker-compose exec postgres psql -U postgres -c "SHOW max_wal_senders;"
```

### Step 4.4: Monitor for 15-30 Minutes

```bash
# Keep watching metrics
./scripts/healthcheck.sh --interval 30

# Alert if any errors appear
# (script will output to terminal)
```

---

## Phase 5: Mark Blue as Standby

### Step 5.1: Scale Down Blue (Keep Running)

```bash
# Keep blue running but don't scale up (hot standby)
docker-compose ps api-blue

# Don't shut down! Needed for quick rollback
```

### Step 5.2: Update Monitoring

```bash
# Update Grafana dashboard to show green is active
# Manually update or wait for next refresh

# Grafana → Dashboard → Blue-Green Deployment
# Change: Active: Green | Standby: Blue
```

### Step 5.3: Log Deployment Success

```bash
cat >> deployment.log << EOF
Phase 4 Complete: ✅ Green deployed and verified
Metrics: No errors detected, all services healthy
Database: Consistent, no replication issues
Ready for production: YES
EOF
```

---

## Phase 6: Rollback Procedure (If Issues Occur)

### ⚠️ When to Rollback

- Error rate > 1%
- Response time > 5s
- Database connectivity issues
- Memory/CPU spike > 80%
- Customer complaints about critical features

### Step 6.1: Immediate Rollback

```bash
# Switch back to blue (immediate)
./scripts/switch-deployment.sh blue

# Expected output:
# ✅ Successfully switched to blue deployment

# Verify
./scripts/switch-deployment.sh status
# Should show: "Current deployment: blue"
```

### Step 6.2: Diagnose Green Failure

```bash
# Inspect green logs
docker-compose logs api-green --tail 200 > green-failure.log

# Check docker inspection
docker inspect infamous-api-green

# Review nginx config change
diff monitoring/nginx/conf.d/default.conf.backup-blue monitoring/nginx/conf.d/default.conf
```

### Step 6.3: Fix Issues

```bash
# Fix the issue in code/config
# Then rebuild green image:
docker build -t ghcr.io/infamous-freight-enterprises/api:v1.1.1 .

# Restart green with fixed version
docker-compose -f docker-compose.yml -f docker-compose.prod.yml \
  down api-green

docker-compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d api-green

# Test before switching again
./scripts/healthcheck.sh --once
```

### Step 6.4: Retry Deployment

```bash
# After fixes, try switch again
./scripts/switch-deployment.sh green

# Monitor carefully for 30 minutes this time
./scripts/healthcheck.sh --interval 15
```

---

## Phase 7: Cleanup (After Successful Deployment)

### Step 7.1: Archive Old Blue Image

```bash
# Keep blue image for 30 days in case of issues
docker tag ghcr.io/infamous-freight-enterprises/api:stable \
  ghcr.io/infamous-freight-enterprises/api:v1.0.0-archived

# Push archive
docker push ghcr.io/infamous-freight-enterprises/api:v1.0.0-archived
```

### Step 7.2: Update Blue from Green

```bash
# After 24 hours of successful green operation
# Copy green version to blue for next deployment cycle

# Stop blue
docker-compose down api-blue

# Restart with new version
docker-compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d api-blue

# Test blue
curl http://api-blue:4000/api/health
```

### Step 7.3: Complete Deployment Log

```bash
cat >> deployment.log << EOF
Phase 7 Complete: ✅ Cleanup finished
Blue updated to v1.1.0 (standby)
Green still running v1.1.0 (active)
Next deployment cycle ready
Summary: Successful blue-green deployment
EOF

# Archive log
cp deployment.log "deployments/deployment-$(date +%Y%m%d-%H%M%S).log"
```

---

## Automated Deployment Script

### Using the Helper Script

```bash
# Full automated deployment
bash -x scripts/blue-green-deploy.sh v1.1.0

# This runs all steps automatically with confirmations
# Output: Clear success/failure messages
```

---

## Monitoring During Deployment

### Key Metrics to Watch

```bash
# Terminal 1: Real-time logs
docker-compose logs -f api-green api-blue

# Terminal 2: Health checks
./scripts/healthcheck.sh --interval 10

# Terminal 3: Metrics
watch -n 1 'docker stats api-green api-blue --no-stream'

# Terminal 4: Nginx logs
docker-compose logs -f nginx | grep -E "upstream|error"
```

---

## Common Issues & Solutions

### Issue: Green won't start

```bash
# Check logs
docker-compose logs api-green

# Solution: Increase start grace period in docker-compose.prod.yml
# Change start_period from 60s to 90s
```

### Issue: Nginx returns 502

```bash
# Check if green is listening on port 4000
docker-compose exec api-green netstat -tlnp | grep 4000

# Solution: Wait longer for green to boot (service startup issue)
```

### Issue: Database connection errors on green

```bash
# Check if green can reach postgres
docker-compose exec api-green curl postgres:5432

# Solution: Ensure DATABASE_URL is correct in docker-compose.prod.yml
```

---

## Runbook Summary

```
1. Verify blue health (./scripts/switch-deployment.sh status)
2. Deploy green from new image (docker-compose up -d api-green)
3. Test green thoroughly (./scripts/switch-deployment.sh health-check)
4. Switch traffic (./scripts/switch-deployment.sh green)
5. Monitor for 15+ minutes (./scripts/healthcheck.sh --interval 30)
6. If issues: Rollback immediately (./scripts/switch-deployment.sh blue)
7. Cleanup after 24h of successful operation
```

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: ✅ Production Ready
