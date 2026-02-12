# Production Deployment Runbook

**Document**: Production Deployment Guide  
**Last Updated**: February 12, 2026  
**Audience**: DevOps, Release Engineers, Administrators  
**Severity**: Critical  

---

## Pre-Deployment Checklist

### Code Quality ✅
- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm check:types`)
- [ ] Linting clean (`pnpm lint`)
- [ ] Code review approved
- [ ] Security scan passed (`npm audit`)

### Database ✅
- [ ] Migration tested in staging
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Database performance verified

### Infrastructure ✅
- [ ] Production environment variables ready
- [ ] SSL certificates valid (>30 days)
- [ ] Database capacity verified
- [ ] CDN configured and tested
- [ ] DNS records updated
- [ ] Email service configured (SendGrid)
- [ ] AWS credentials configured (S3)
- [ ] DocuSign OAuth2 tokens fresh

### Monitoring ✅
- [ ] Sentry project created and configured
- [ ] Datadog/New Relic dashboard ready
- [ ] Alerting rules configured
- [ ] Log aggregation working
- [ ] Performance baselines established

### Documentation ✅
- [ ] Release notes prepared
- [ ] Runbooks updated
- [ ] Team briefed on changes
- [ ] Incident response plan ready

---

## Deployment Steps

### Step 1: Pre-Deployment (30 min)

```bash
# 1. Verify current state
$ git status                    # Should be clean
$ docker ps                     # Current containers running
$ pg_isready -h $DB_HOST       # Database connectivity

# 2. Create backup
$ pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
$ aws s3 cp backup.sql s3://backups/

# 3. Stop traffic (optional, for zero-downtime)
$ kubectl set deployment/api replicas=2
```

### Step 2: Database Migration (15 min)

```bash
# 1. Check migration status
$ cd apps/api
$ pnpm prisma migrate status

# 2. Verify migration
$ pnpm prisma migrate resolve --rolled-back <migration_name>

# 3. Apply migration
$ pnpm prisma migrate deploy

# 4. Verify data integrity
$ pnpm prisma db push --skip-validate
```

### Step 3: Deploy Application (20 min)

```bash
# 1. Build Docker images
$ docker build -f Dockerfile.api -t infamous-api:$(git rev-parse --short HEAD) .
$ docker build -f Dockerfile.web -t infamous-web:$(git rev-parse --short HEAD) .

# 2. Tag for registry
$ docker tag infamous-api:... $REGISTRY/infamous-api:latest
$ docker tag infamous-web:... $REGISTRY/infamous-web:latest

# 3. Push to registry
$ docker push $REGISTRY/infamous-api:latest
$ docker push $REGISTRY/infamous-web:latest

# 4. Trigger deployment
$ kubectl set image deployment/api api=$REGISTRY/infamous-api:latest
$ kubectl set image deployment/web web=$REGISTRY/infamous-web:latest

# 5. Monitor rollout
$ kubectl rollout status deployment/api --timeout=5m
$ kubectl rollout status deployment/web --timeout=5m
```

### Step 4: Verification (15 min)

```bash
# 1. Check health endpoints
$ curl https://api.infamous-freight.com/api/health
$ curl https://infamous-freight.com/api/health

# 2. Check specific features
$ curl https://api.infamous-freight.com/api/shipments
$ curl https://api.infamous-freight.com/api/health/detailed

# 3. Monitor error rates
$ watch 'curl -s https://api.infamous-freight.com/api/health | jq'

# 4. Check Sentry dashboard
# Go to https://sentry.io/crimes/... and verify no spike in errors

# 5. Verify database
$ psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM shipments;"
```

### Step 5: Post-Deployment (10 min)

```bash
# 1. Run smoke tests
$ pnpm test:e2e --tag=smoke

# 2. Clear caches
$ redis-cli FLUSHDB  # If using Redis

# 3. Send deployment notification
$ curl -X POST https://hooks.slack.com/services/... \
  -H 'Content-Type: application/json' \
  -d '{"text":"✅ Production deployment completed"}'

# 4. Update status page
# Go to https://status.infamous-freight.com and update

# 5. Notify stakeholders
# Email: team@infamous-freight.com with release notes
```

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Immediate rollback
$ kubectl rollout undo deployment/api
$ kubectl rollout undo deployment/web

# 2. Verify previous version running
$ kubectl describe pods -l app=api

# 3. Restore database (if migration failed)
$ psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql

# 4. Clear caches
$ redis-cli FLUSHDB

# 5. Verify health
$ curl https://api.infamous-freight.com/api/health

# 6. Report incident
$ Create incident in PagerDuty
$ Post to #incidents Slack channel
```

---

## Database Migration Checklist

### Before Migration
- [ ] Backup created and tested
- [ ] Migrations validated locally
- [ ] No long-running queries
- [ ] Read replicas in sync
- [ ] Maintenance window scheduled (if needed)

### During Migration
- [ ] Monitor query performance
- [ ] Watch for locks
- [ ] Check disk space
- [ ] Monitor error rates
- [ ] Have rollback ready

### After Migration
- [ ] Verify data integrity
- [ ] Update database statistics
- [ ] Monitor performance
- [ ] Document any issues
- [ ] Update runbooks

---

## Common Issues & Solutions

### Issue: Deployment timeout
```bash
# Check pod status
$ kubectl describe pod -l app=api

# Increase timeout
$ kubectl rollout status deployment/api --timeout=10m

# Force new deployment
$ kubectl rollout restart deployment/api
```

### Issue: Database connection errors
```bash
# Check database
$ pg_isready -h $DB_HOST

# Check credentials
$ psql -h $DB_HOST -U $DB_USER -c "SELECT version();"

# Check network
$ curl -v telnet://$DB_HOST:5432
```

### Issue: CDN not updating
```bash
# Clear CloudFront cache
$ aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

# Verify DNS
$ nslookup infamous-freight.com
```

### Issue: Email service not working
```bash
# Check SendGrid API key
$ curl -X GET https://api.sendgrid.com/v3/mail_settings \
  -H "Authorization: Bearer $SENDGRID_API_KEY"

# Test email
$ curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## Monitoring During Deployment

### Metrics to Watch
- ✅ Error rate (should stay < 0.1%)
- ✅ Response time (p95 should stay < 500ms)
- ✅ CPU usage (should not exceed 80%)
- ✅ Memory usage (should not exceed 85%)
- ✅ Database connections (should not max out)

### Dashboards to Check
1. Datadog Application Performance
2. Sentry Error Tracking
3. Kubernetes Pod Status
4. Database Performance
5. External Service Status (SendGrid, AWS)

---

## Deployment Windows

### Standard Window (Low Impact)
- **When**: Tuesdays, 2-4 AM UTC
- **Duration**: 30-60 minutes
- **Communication**: Announce 48 hours in advance
- **Users Affected**: None (designed for zero downtime)

### Maintenance Window (With Downtime)
- **When**: Quarterly (database major version upgrades)
- **Duration**: 2-4 hours
- **Communication**: Announce 1 week in advance
- **Users Affected**: All - service will be unavailable

---

## Rollback Communication

If rollback needed:

1. **Immediate** (0 min):
   - Trigger rollback
   - Assess impact
   
2. **5 minutes**:
   - Verify service recovered
   - Post to #incidents
   
3. **10 minutes**:
   - Send email to team@infamous-freight.com
   - Update status page
   
4. **30 minutes**:
   - Post-incident call with team
   - Document root cause
   
5. **1 hour**:
   - Write incident report
   - Schedule remediation work

---

## Post-Deployment Review

After successful deployment:

- [ ] Review Sentry error trends
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Document any issues encountered
- [ ] Update runbooks based on learnings
- [ ] Schedule performance review

---

## Emergency Contacts

**On-Call**: `@on-call-engineer` (Slack)  
**Tech Lead**: `@tech-lead` (Slack)  
**DevOps**: `@devops-team` (Slack)  
**CTO**: `cto@infamous-freight.com`  

---

**Deployment Runbook Owner**: DevOps Team  
**Last Updated**: February 12, 2026  
**Review Schedule**: Quarterly  

