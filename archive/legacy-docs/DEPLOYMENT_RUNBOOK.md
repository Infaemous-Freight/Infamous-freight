# Deployment Runbook

**Project**: Infamous Freight Enterprises  
**Last Updated**: December 30, 2025  
**Status**: Ready for Staging Deployment

---

## Pre-Deployment Checklist

### Code Quality

- [ ] TypeScript compilation passes (`pnpm typecheck`)
- [ ] All tests pass (`pnpm test`)
- [ ] ESLint warnings resolved (`pnpm lint`)
- [ ] No console errors in build output

### Security

- [ ] Dependency audit passed (`pnpm audit`)
- [ ] No high/critical vulnerabilities
- [ ] JWT_SECRET is set (32+ characters)
- [ ] Database credentials are secure
- [ ] API keys are in environment variables
- [ ] CORS_ORIGINS is restricted to known domains

### Performance

- [ ] Bundle size analyzed
- [ ] Database indexes verified
- [ ] Redis connection tested
- [ ] Load test results acceptable

### Infrastructure

- [ ] Staging environment prepared
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Monitoring/logging configured
- [ ] Backup strategy verified

---

## Staging Deployment Steps

### 1. Prepare Staging Environment

```bash
# 1.1 Clone/pull latest code
cd /workspaces/Infamous-freight-enterprises
git checkout main
git pull origin main

# 1.2 Install dependencies
pnpm install --frozen-lockfile

# 1.3 Build the project
pnpm build

# 1.4 Verify no errors
pnpm typecheck
```

### 2. Configure Environment

```bash
# 2.1 Create .env.staging file
cat > .env.staging << EOF
NODE_ENV=staging
API_PORT=4000
WEB_PORT=3000
DATABASE_URL=postgresql://user:pass@staging-db:5432/freight_staging
REDIS_URL=redis://staging-redis:6379
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
CORS_ORIGINS=https://staging.yourdomain.com
LOG_LEVEL=info
PROMETHEUS_URL=http://staging-prometheus:9090
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
EOF

# 2.2 Copy to staging servers
scp .env.staging staging-api:/app/.env
scp .env.staging staging-web:/app/.env
```

### 3. Deploy API

```bash
# 3.1 Stop current API
ssh staging-api "systemctl stop freight-api"

# 3.2 Deploy new version
cd src/apps/api
pnpm build
scp -r dist/* staging-api:/app/dist/
scp package.json staging-api:/app/

# 3.3 Run migrations
ssh staging-api "cd /app && pnpm prisma:migrate"

# 3.4 Start API
ssh staging-api "systemctl start freight-api"

# 3.5 Verify health
curl https://staging-api.yourdomain.com/api/health
```

### 4. Deploy Web

```bash
# 4.1 Build Next.js
cd src/apps/web
pnpm build

# 4.2 Deploy
scp -r .next/* staging-web:/app/.next/
scp package.json staging-web:/app/

# 4.3 Restart web server
ssh staging-web "systemctl restart freight-web"

# 4.4 Verify
curl https://staging.yourdomain.com/
```

### 5. Post-Deployment Verification

```bash
# 5.1 Check API health
curl -H "Authorization: Bearer $TOKEN" \
     https://staging-api.yourdomain.com/api/health

# 5.2 Check monitoring
curl https://staging-api.yourdomain.com/api/metrics/health

# 5.3 Verify database connection
curl https://staging-api.yourdomain.com/api/metrics/ready

# 5.4 Check WebSocket
# Navigate to https://staging.yourdomain.com and open browser console
# Should see: "WebSocket connected"

# 5.5 Monitor logs
ssh staging-api "tail -f /var/log/freight-api/combined.log"
```

---

## Production Deployment Steps

### Pre-Production Validation (Day 1)

```bash
# 1. Full UAT sign-off
grep -r "Sign-off" ../UAT_TESTING_GUIDE.md

# 2. Security scan
pnpm audit
snyk test

# 3. Performance baseline
k6 run scripts/load-test-performance.js

# 4. Database backup
pg_dump production_db > backup-$(date +%Y%m%d).sql
```

### Blue-Green Deployment (Day 2)

```bash
# 1. Start "Green" (new) environment
# Deploy to new servers without traffic

# 2. Run smoke tests
./scripts/smoke-tests.sh green

# 3. Verify metrics
curl https://green-api.yourdomain.com/api/metrics/health

# 4. Switch traffic to Green
# Update load balancer DNS to point to green servers

# 5. Monitor old "Blue" for 24 hours
# If issues detected, switch back to Blue

# 6. After 24 hours, decommission Blue
```

### Rollback Procedure

```bash
# If critical issues detected in production:

# 1. Switch traffic back to previous version
ssh lb-primary "update-dns-to-blue"

# 2. Investigate root cause
ssh production-api "tail -f /var/log/freight-api/error.log"

# 3. Verify previous version working
curl https://api.yourdomain.com/api/health

# 4. Post-incident review
# Document what went wrong and how to prevent it
```

---

## Monitoring During Deployment

### Real-time Metrics to Watch

```bash
# Terminal 1: Monitor API logs
ssh production-api "tail -f /var/log/freight-api/combined.log"

# Terminal 2: Monitor error rate
watch "curl -s https://api.yourdomain.com/api/metrics/performance | grep error_rate"

# Terminal 3: Monitor latency
watch "curl -s https://api.yourdomain.com/api/metrics/performance | grep p95_latency"

# Terminal 4: Monitor WebSocket connections
watch "curl -s https://api.yourdomain.com/api/metrics/websocket | grep connections"

# Terminal 5: Monitor database
psql production_db -c "SELECT count(*) as active_connections FROM pg_stat_activity;"
```

### Alert Thresholds

```
ERROR_RATE > 1%              → CRITICAL: Investigate immediately
P95_LATENCY > 1000ms         → WARNING: May need scaling
P99_LATENCY > 2000ms         → CRITICAL: System degraded
WEBSOCKET_DISCONNECT > 10/s  → WARNING: Connection issues
MEMORY_USAGE > 85%           → WARNING: May need restart
DATABASE_CONNECTIONS > 80%   → WARNING: Connection pool nearly full
```

---

## Database Management

### Before Deployment

```bash
# 1. Backup database
pg_dump -h prod-db -U freight -d freight_prod > backup.sql

# 2. Test migration locally
pnpm prisma migrate deploy --preview-feature

# 3. Verify rollback
# Keep backup until 24 hours post-deployment
```

### After Deployment

```bash
# 1. Verify data integrity
psql -c "SELECT COUNT(*) FROM shipments WHERE status='PENDING';"
psql -c "SELECT COUNT(*) FROM users WHERE role='DRIVER';"

# 2. Monitor query performance
# Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

# 3. Archive old backups
aws s3 cp backup.sql s3://backups/archive/backup-$(date +%Y%m%d).sql
```

---

## Rollback Decision Tree

```
Issue Detected?
├─ Critical (Error Rate > 5%)
│  ├─ Response: IMMEDIATE ROLLBACK
│  └─ Action: Switch traffic to previous version
│
├─ High (P95 Latency > 2000ms)
│  ├─ Response: INVESTIGATE (5 min)
│  ├─ If fixable: Deploy fix
│  └─ If not: ROLLBACK
│
└─ Medium (P95 Latency > 1000ms)
   ├─ Response: MONITOR (15 min)
   ├─ If improving: Continue monitoring
   ├─ If stable: Accept
   └─ If worsening: ROLLBACK
```

---

## Post-Deployment Checklist

### First 1 Hour

- [ ] All endpoints responding (< 500ms)
- [ ] Error rate < 1%
- [ ] WebSocket connections stable
- [ ] Database queries normal
- [ ] No Sentry alerts

### First 24 Hours

- [ ] Error rate remained < 1%
- [ ] P95 latency stable
- [ ] No data inconsistencies
- [ ] Backup tested and working
- [ ] Team feedback positive

### First 7 Days

- [ ] All workflows functioning
- [ ] Performance baseline established
- [ ] User feedback incorporated
- [ ] Lessons learned documented
- [ ] Plan next improvements

---

## Escalation Contacts

| Severity | First Response            | Escalation                |
| -------- | ------------------------- | ------------------------- |
| Critical | On-call engineer (5 min)  | Engineering manager + CTO |
| High     | On-call engineer (15 min) | Engineering manager       |
| Medium   | Daytime engineer (1 hour) | Engineering manager       |
| Low      | Next business day         | Product manager           |

---

## Emergency Contacts

**On-Call Engineer**: [Name] +1-[Phone]  
**Engineering Manager**: [Name] +1-[Phone]  
**CTO**: [Name] +1-[Phone]  
**Database Administrator**: [Name] +1-[Phone]

**Slack Channel**: #incident-response  
**Status Page**: https://status.yourdomain.com  
**Incident Log**: https://incidents.yourdomain.com

---

## Common Issues & Fixes

### Issue: WebSocket Connections Failing

```bash
# Check Redis
redis-cli PING  # Should return PONG

# Check Socket.IO adapter
curl https://api.yourdomain.com/api/metrics/websocket

# Restart service
systemctl restart freight-api
```

### Issue: Database Connection Pool Exhausted

```bash
# Check connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# If > 80 connections:
# 1. Restart API
systemctl restart freight-api

# 2. Check for connection leaks
grep -r "prisma.$disconnect" src/
```

### Issue: Memory Leak Suspected

```bash
# Check memory usage
free -h

# Monitor growth
watch -n 5 'ps aux | grep node | grep -v grep'

# If growing: Restart API gracefully
systemctl restart freight-api

# Keep monitoring
# If restarts don't help: Check for memory leaks
node --trace-gc src/server.js
```

---

## Success Metrics

**Deployment Successful if**:

- ✅ All health checks passing
- ✅ Error rate < 1%
- ✅ P95 latency < 500ms
- ✅ WebSocket stable
- ✅ No critical logs
- ✅ Team confirms functionality

---

**Next**: Execute staging deployment, then move to production
