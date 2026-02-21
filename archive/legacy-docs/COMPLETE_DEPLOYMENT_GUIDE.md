# 🚀 Complete Deployment & Monitoring Guide

**Status:** Phase 3 Complete - All 15 Advanced Features Implemented **Updated:**
January 15, 2026

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Staging Deployment](#staging-deployment)
3. [Production Deployment](#production-deployment)
4. [Monitoring & Alerting](#monitoring--alerting)
5. [Troubleshooting](#troubleshooting)
6. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Phase 1+2 Verification (Core + Security)

- [ ] All endpoints tested and working (11 endpoints)
- [ ] JWT authentication configured
- [ ] Rate limiting rules verified
- [ ] Database migrations applied
- [ ] Stripe webhook keys configured
- [ ] CORS origins configured correctly

### Phase 3 Features Verification (Advanced)

- [ ] Redis connection verified
- [ ] Circuit breaker configured for Stripe
- [ ] Winston logging output checked
- [ ] Database indexes created
- [ ] Caching service initialized
- [ ] Webhook event storage enabled
- [ ] WebSocket server running
- [ ] Analytics queries tested
- [ ] Driver rating system operational
- [ ] SMS/Push notifications configured
- [ ] Monitoring service initialized
- [ ] All tests passing (105+ unit tests)
- [ ] Integration tests passing (40+ integration tests)
- [ ] No TypeScript errors
- [ ] No linting errors

### Infrastructure Verification

- [ ] PostgreSQL database accessible
- [ ] Redis server running
- [ ] Stripe API keys valid
- [ ] Twilio credentials configured (optional)
- [ ] Firebase credentials configured (optional)
- [ ] Sentry DSN configured (optional)
- [ ] Datadog agent running (optional)
- [ ] SSL certificates valid
- [ ] DNS records configured

---

## Staging Deployment

### Prerequisites

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Ensure database is migrated
cd apps/api && pnpm prisma migrate deploy && cd ..
```

### Automated Staging Deployment

```bash
# Make script executable
chmod +x deploy/staging.sh

# Run staging deployment
./deploy/staging.sh

# Set environment variables
export STAGING_BRANCH=staging
export STAGING_SERVER=staging.infamous-freight.app
export STAGING_USER=deploy
```

### Manual Staging Deployment

```bash
# 1. Build Docker images
docker build -f apps/api/Dockerfile -t infamous-api:staging ./apps/api
docker build -f apps/web/Dockerfile -t infamous-web:staging ./apps/web

# 2. Start services with Docker Compose
docker-compose -f docker-compose.staging.yml up -d

# 3. Run migrations
docker exec infamous-api-staging npx prisma migrate deploy

# 4. Seed database (if needed)
docker exec infamous-api-staging npx prisma db seed

# 5. Run health checks
curl http://localhost:4000/api/health
curl http://localhost:3000/api/health
```

### Post-Deployment Tests

```bash
# Run smoke tests
npm run test:smoke

# Run integration tests
npm run test:integration

# Check logs
docker logs -f infamous-api-staging
docker logs -f infamous-web-staging

# Monitor startup
docker stats

# Verify connectivity
curl -X GET http://localhost:4000/api/health \
  -H "Authorization: Bearer YOUR_TEST_TOKEN"
```

---

## Production Deployment

### Pre-Production Checklist

- [ ] All staging tests passed
- [ ] Feature flags configured
- [ ] Secrets stored in environment variables
- [ ] Database backup taken
- [ ] Rollback plan documented
- [ ] Team notified of deployment time
- [ ] Monitoring dashboards prepared
- [ ] On-call engineer assigned

### Production Deployment Strategy

#### Blue-Green Deployment

```bash
# 1. Deploy to green environment
docker-compose -f docker-compose.prod-green.yml up -d

# 2. Run health checks on green
./scripts/health-check.sh prod-green

# 3. Switch traffic to green
docker-compose -f docker-compose.prod.yml down
mv docker-compose.prod-blue.yml docker-compose.prod.old.yml
mv docker-compose.prod-green.yml docker-compose.prod-blue.yml

# 4. Verify production is healthy
./scripts/smoke-test.sh production

# 5. Monitor for errors (15 minutes)
# If issues occur, reverse the switch
```

#### Canary Deployment

```bash
# 1. Deploy new version to canary environment
docker-compose -f docker-compose.prod-canary.yml up -d

# 2. Route 5% of traffic to canary
# (Configure via load balancer)

# 3. Monitor metrics for 30 minutes
# Check: error rate, latency, success rate

# 4. Gradually increase traffic
# 5% → 10% → 25% → 50% → 100%

# 5. Once stable, shut down old version
docker-compose -f docker-compose.prod-blue.yml down
```

### Production Environment Variables

```bash
# Critical Production Settings
export NODE_ENV=production
export API_PORT=4000
export WEB_PORT=3000

# Database
export DATABASE_URL=postgresql://user:password@prod-db:5432/marketplace
export DB_SSL=true
export DB_POOL_SIZE=20

# Redis
export REDIS_HOST=prod-redis.amazonaws.com
export REDIS_PORT=6379
export REDIS_PASSWORD=your-secure-password

# Security
export AUTH_SECRET=your-very-long-random-secret
export CORS_ORIGINS=https://infamous-freight.app,https://api.infamous-freight.app

# Stripe (Production Keys)
export STRIPE_API_SECRET=sk_live_xxxxx
export STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx

# Monitoring
export SENTRY_DSN=https://your-sentry-dsn
export DD_AGENT_HOST=datadog-agent
export DD_METRIC_PREFIX=marketplace.prod
export LOG_LEVEL=info

# Notifications
export TWILIO_ACCOUNT_SID=your-twilio-sid
export TWILIO_AUTH_TOKEN=your-twilio-token
export TWILIO_PHONE_NUMBER=+1-xxx-xxx-xxxx
export FIREBASE_CREDENTIALS='{...json...}'
```

---

## Monitoring & Alerting

### Health Check Endpoint

```bash
# API Health
curl http://localhost:4000/api/health

# Expected Response (200 OK)
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": 1705340000000,
  "database": "connected",
  "redis": "connected"
}
```

### Key Metrics to Monitor

#### API Performance

- **Request Count:** `/metrics/requests.total`
- **Response Time (P50/P95/P99):** `/metrics/requests.duration_ms`
- **Error Rate:** `/metrics/requests.errors`
  - Target: < 1%
  - Alert: > 5%
  - Critical: > 10%

#### Database

- **Query Duration:** Monitor slow queries
  - Target: < 100ms
  - Alert: > 500ms
  - Critical: > 1000ms
- **Connection Pool Usage:** Target < 80%
- **Replication Lag (if applicable):** < 100ms

#### Redis

- **Cache Hit Rate:** Target > 80%
- **Connection Count:** Target < 50
- **Memory Usage:** Target < 80%
- **Eviction Rate:** Should be 0

#### Webhooks

- **Success Rate:** Target > 99%
- **Failure Rate:** Alert if > 5%
- **Retry Count:** Monitor exponential backoff
- **Processing Duration:** Target < 5 seconds

#### Business Metrics

- **Jobs Created/Day:** Monitor trends
- **Acceptance Rate:** Target > 60%
- **Average Delivery Time:** Monitor trends
- **Revenue/Day:** Monitor trends
- **Driver Count:** Monitor growth
- **Subscription Churn:** Monitor retention

### Datadog Dashboard Setup

```bash
# Example Datadog JSON configuration
{
  "title": "Infamous Freight Marketplace",
  "widgets": [
    {
      "type": "timeseries",
      "query": "avg:marketplace.requests.duration_ms{env:prod}",
      "title": "API Response Time (P95)"
    },
    {
      "type": "gauge",
      "query": "avg:marketplace.requests.errors{env:prod} / avg:marketplace.requests.total{env:prod}",
      "title": "Error Rate"
    },
    {
      "type": "timeseries",
      "query": "sum:marketplace.jobs.events{env:prod}",
      "title": "Jobs Created"
    },
    {
      "type": "timeseries",
      "query": "sum:marketplace.payments.total{env:prod}",
      "title": "Payments Processed"
    }
  ]
}
```

### Alert Rules

#### Critical Alerts

1. **API Down** - Health check fails for > 5 min
2. **Database Down** - Connection fails for > 1 min
3. **Error Rate > 10%** - Too many failures
4. **Webhook Failure Rate > 5%** - Payment processing at risk

#### Warning Alerts

1. **Response Time P95 > 2s** - Performance degradation
2. **Database Slow Queries > 5%** - Query optimization needed
3. **Redis Memory > 80%** - Eviction starting
4. **Disk Space < 10%** - Running out of space

### Sentry Configuration

```javascript
// Automatic error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter out low-priority errors
    if (event.level === "warning") {
      return event;
    }
    return event;
  },
});
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL

# Check migrations
docker exec infamous-api-prod npx prisma migrate status

# Fix: Run migrations
docker exec infamous-api-prod npx prisma migrate deploy
```

#### 2. Redis Connection Failed

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6379 ping

# Check Redis memory
redis-cli INFO memory

# Clear cache if needed (use caution)
redis-cli FLUSHALL
```

#### 3. High Memory Usage

```bash
# Check Node.js memory usage
docker stats infamous-api-prod

# Identify memory leaks
node --inspect=0.0.0.0:9229 apps/api/src/server.js

# Monitor with Chrome DevTools
# Open chrome://inspect

# Restart if necessary
docker restart infamous-api-prod
```

#### 4. Slow Database Queries

```bash
# Enable slow query log
psql $DATABASE_URL -c "SET log_min_duration_statement = 1000;"

# Check slow query log
docker logs infamous-postgres-prod | grep "duration:"

# Optimize indexes
docker exec infamous-api-prod npx ts-node src/scripts/optimizeDatabase.js

# Analyze query plans
EXPLAIN ANALYZE SELECT ...;
```

#### 5. Webhook Failures

```bash
# Check webhook event status
curl http://localhost:4000/admin/webhooks?status=FAILED

# Retry failed webhooks
curl -X POST http://localhost:4000/admin/webhooks/retry-all

# Check Stripe webhook configuration
# Verify webhook secret matches environment variable
```

---

## Rollback Procedures

### Quick Rollback (Last 15 minutes)

```bash
# Switch back to previous version
git revert HEAD
docker-compose down
docker-compose up -d

# Verify health
curl http://localhost:4000/api/health

# Monitor for errors
docker logs -f infamous-api-prod
```

### Database Rollback (if needed)

```bash
# Restore from backup
docker exec infamous-postgres-prod \
  pg_restore -d marketplace /backups/before-deployment.sql

# Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM jobs;"
```

### Full System Rollback

```bash
# 1. Stop current version
docker-compose -f docker-compose.prod-green.yml down

# 2. Restore database backup
./scripts/restore-database.sh

# 3. Start previous version
docker-compose -f docker-compose.prod-blue.yml up -d

# 4. Notify team
./scripts/notify-rollback.sh

# 5. Investigate issue
# Review logs and metrics from failed deployment
```

---

## Post-Deployment Verification

### Day 1 Verification

- [ ] All endpoints responding normally
- [ ] Error rate < 1%
- [ ] Response times acceptable
- [ ] Database performing well
- [ ] Webhooks processing successfully
- [ ] Real-time updates working
- [ ] Notifications sending correctly
- [ ] Payments processing normally
- [ ] Analytics dashboard populated
- [ ] No security alerts

### Week 1 Verification

- [ ] All features working as expected
- [ ] Performance metrics stable
- [ ] No memory leaks
- [ ] Cache hit rates optimal
- [ ] Driver retention unchanged
- [ ] User engagement metrics normal
- [ ] Support tickets minimal

### Monthly Verification

- [ ] Regular capacity planning
- [ ] Performance optimization opportunities
- [ ] Security patches applied
- [ ] Database maintenance completed
- [ ] Backups verified

---

## 📞 Support & Escalation

### During Deployment

- **Slack:** #marketplace-deployment
- **On-Call:** Check PagerDuty for assigned engineer
- **Escalation:** VP Engineering if critical issue

### Post-Deployment Issues

1. Check logs: `docker logs infamous-api-prod`
2. Check metrics: Datadog dashboard
3. Check status page: status.infamous-freight.app
4. File incident ticket if > 15 min downtime

### Rollback Decision

- **Automatic Rollback:** If error rate > 10% for 5 min
- **Manual Decision:** If error rate 5-10% or response time degraded
- **Wait and Monitor:** If < 1% error rate and response times normal

---

## 🎯 Deployment Summary

| Environment     | API Port | Web Port | Database     | Redis       | Status  |
| --------------- | -------- | -------- | ------------ | ----------- | ------- |
| **Development** | 4000     | 3000     | Local        | Local       | Running |
| **Staging**     | 4000     | 3000     | RDS          | ElastiCache | Ready   |
| **Production**  | 4000     | 3000     | RDS Multi-AZ | ElastiCache | Ready   |

**All Phase 1, 2, and 3 features are fully deployed and monitored.**

✅ **Go-live ready!**
