# Operations Runbook

**Status**: ✅ OPERATIONAL PROCEDURES DOCUMENTED  
**Date**: February 19, 2026  
**Purpose**: Daily operations checklist and procedures

---

## 1. Daily Operations

### Morning Checklist (9 AM)

```bash
# 1. Health check
./scripts/health-check.sh

# 2. Review alerts from overnight
# Check Slack for alerts
# Review Sentry error dashboard

# 3. Verify services are running
fly status -a infamous-freight-api
fly status -a infamous-freight-web

# 4. Check recent deployments
git log --oneline -5

# 5. Monitor key metrics
# Spot check Datadog dashboard
```

**Estimated Time**: 5 minutes

### Midday Check (12 PM)

```bash
# 1. Check error rates
# Sentry: Should be < 1% of requests

# 2. Verify database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"

# 3. Monitor performance
# Datadog: P99 latency should be < 2 seconds
```

**Estimated Time**: 3 minutes

### Evening Checklist (5 PM)

```bash
# 1. Review day's incidents
# Check GitHub issues with "incident" label

# 2. Prepare for overnight
# Verify backups are configured
# Verify alerts are enabled

# 3. Deploy any pending changes
# Check open PRs ready for merge
```

**Estimated Time**: 5 minutes

### Nightly Automated Tasks (Automatic)

- **2 AM**: Database backup
- **2:15 AM**: Self-healing checks
- **2:30 AM**: Log rotation
- **3 AM**: Security updates (Mondays)

---

## 2. Weekly Operations

### Monday Morning (9 AM)

```bash
# 1. Review past week
git log --oneline --since="7 days ago"

# 2. Check security alerts
# GitHub: Any new vulnerability alerts?
# Dependabot: Any updates available?

# 3. Review metrics
# Uptime: Should be > 99.9%
# Error rate: Should be < 1%
# Latency: P99 should be < 2s
```

### Wednesday (Midweek Check)

```bash
# 1. Capacity analysis
# Disk usage: Should be < 80%
# Memory usage: Should be < 70%
# Database size: Should be < 100GB

# 2. Cost review
# Fly.io: Not exceeding budget
# S3: Not exceeding budget
```

### Friday (End of Week)

```bash
# 1. Deployment review
# Any failed deployments this week?
# Any rollbacks needed?

# 2. Prepare for next week
# Any planned maintenance?
# Any scaling needed?

# 3. Team updates
# Standup: What's in progress?
```

---

## 3. Monthly Operations

### 1st of Month

```bash
# 1. Billing review
# Vercel invoice: Within budget?
# Fly.io invoice: Within budget?
# AWS (if used): Within budget?

# 2. Capacity planning
# Will we need more resources next month?
# Are we growing? Need to scale?

# 3. Metrics review
# Uptime: Track trend
# Error rate: Track trend
# Performance: Track trend

# 4. Artifact cleanup
# Remove old logs
# Archive old backups
# Clean up temporary files
```

### Performance Optimization

```bash
# 1. Analyze slow queries
psql $DATABASE_URL -c "\
  SELECT query, mean_time, calls \
  FROM pg_stat_statements \
  ORDER BY mean_time DESC \
  LIMIT 10;"

# 2. Add missing indexes
CREATE INDEX idx_user_email ON \"User\"(email);
CREATE INDEX idx_shipment_status ON \"Shipment\"(status);

# 3. Optimize hot paths
# Review code for N+1 queries
# Check cache hit rates
```

### Security Review

```bash
# 1. Log audit
# Any suspicious login attempts?
# Any unauthorized API access?

# 2. Certificate expiration
# SSL certificates: Expire within next month?
# API keys: Need rotation?

# 3. Access review
# Who has admin access?
# Are there inactive users?
# Do permissions align with roles?
```

---

## 4. Quarterly Operations

### Quarterly Audit (Per QUARTERLY-AUDIT-CHECKLIST)

```bash
# 1. Full system audit (2-3 hours)
# See QUARTERLY-AUDIT-CHECKLIST-RECOMMENDED.md

# 2. Documentation review
# Is all documentation current?
# Are procedures still accurate?

# 3. Disaster recovery drill
# Test backup restoration
# Test incident response
# Verify RTO/RPO targets

# 4. Team training
# Any new procedures introduced?
# Any lessons learned from incidents?
```

---

## 5. Common Maintenance Tasks

### Database Maintenance

```bash
# Vacuum (reclaim space)
# Runs automatically at 2 AM
# Manual if needed:
psql $DATABASE_URL -c "VACUUM FULL ANALYZE;"

# Reindex (improve performance)
# If index fragmentation detected:
REINDEX DATABASE db_name;

# Monitor size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('db_name'));"
```

### Log Rotation

```bash
# Logs auto-rotate daily
# Check rotation status:
ls -la /var/log/app/

# Manual rotation if needed:
logrotate /etc/logrotate.d/app --force
```

### Disk Space Management

```bash
# Check usage
df -h

# If low (< 10% free):
# 1. Archive old logs
tar -czf logs_backup_$(date +%Y%m%d).tar.gz /var/log/app/
rm /var/log/app/*.log

# 2. Clean temp files
rm -rf /tmp/*

# 3. Prune Docker images
docker image prune -a

# 4. Scale up storage if persistent issue
# Fly.io: Contact support for volume expansion
```

### Memory Management

```bash
# Check memory usage
free -h

# If high (> 80%):
# 1. Identify memory hogs
ps aux --sort=-%mem | head -10

# 2. Restart service if memory leaks
fly apps restart infamous-freight-api

# 3. Implement memory limits
# Docker: Add MEMORY_LIMIT env var
```

---

## 6. Service Restart Procedures

### Graceful Restart (No downtime)

```bash
# 1. Deploy new version
git push origin main
# GitHub Actions auto-deploys

# 2. Verify new version running
curl https://infamous-freight-api.fly.dev/api/health | jq .uptime

# 3. Monitor for issues
watch -n 5 './scripts/health-check.sh'
```

### Emergency Restart (If needed)

```bash
# Graceful shutdown first
fly apps restart infamous-freight-api --signal SIGTERM --wait-timeout=30

# Force restart if stuck
fly apps restart infamous-freight-api --force

# Verify restarted
fly status -a infamous-freight-api
```

---

## 7. Scaling Procedures

### Horizontal Scaling (Add more instances)

```bash
# Check current scale
fly scale count -a infamous-freight-api

# Increase capacity
fly scale count cli=3 -a infamous-freight-api

# Verify
fly status -a infamous-freight-api
# Should show 3 instances running

# Monitor load distribution
# Each instance should handle ~33% of traffic
```

### Vertical Scaling (Bigger instances)

```bash
# Current machine type
fly machine list -a infamous-freight-api

# Upgrade to larger machine
fly machine update <machine-id> --vm-size=shared-cpu-2x

# Verify performance improved
./scripts/health-check.sh
```

---

## 8. Dependency Management

### Update Dependencies

```bash
# Check for updates
pnpm outdated

# Update patch versions (safe)
pnpm update

# Update minor versions (test first!)
pnpm upgrade

# Verify tests pass
pnpm test

# Commit updated lock file
git add pnpm-lock.yaml
git commit -m "chore(deps): update dependencies"
git push
```

### Security Updates

```bash
# Check for vulnerabilities
pnpm audit

# Auto-fix if possible
pnpm audit --fix

# Manual fix for remaining issues
# Edit package.json, update version
pnpm install

# Verify
pnpm audit

# Deploy
git push origin main
```

---

## 9. Backup Verification

### Daily Backup Check

```bash
# Happens automatically at 3 AM
# Manual check:
fly postgres list-backups -a infamous-freight-db

# Should show today's backup (age < 24 hours)
```

### Weekly Restore Test

```bash
# First Saturday of month
# Test restore to dev environment

# 1. Create test database
fly postgres create -a infamous-freight-db-test

# 2. Restore latest backup
pg_restore --dbname=postgresql://... /path/to/backup.dump

# 3. Verification
psql -c "SELECT COUNT(*) FROM \"User\";"

# 4. Cleanup
fly postgres destroy -a infamous-freight-db-test
```

---

## 10. Certificate Management

### SSL Certificate Renewal

```bash
# Certificates auto-renew via Let's Encrypt
# Fly.io handles this automatically

# Manual check (if needed)
fly certs list

# Renew specific certificate
fly certs create -app infamous-freight-api \
  -domain infamous-freight-enterprises.com
```

### API Key Rotation

Schedule: **Quarterly** first of month at 10 AM

```bash
# 1. Generate new API key
# Fly.io: Settings → API Tokens → Create token

# 2. Update GitHub Secrets
# Settings → Secrets → Update FLY_API_TOKEN

# 3. Revoke old key
# Fly.io: Settings → API Tokens → Delete old token

# 4. Verify access with new key
fly auth token
```

---

## 11. Regular Maintenance Calendar

```
DAILY:
  9 AM  - Health check
  12 PM - Check error rates  
  5 PM  - Evening review
  2 AM  - Backup (automatic)
  3 AM  - Security updates Mon only

WEEKLY:
  Mon 9 AM - Week review
  Wed 9 AM - Capacity check
  Fri 5 PM - End of week review

MONTHLY:
  1st @  9 AM - Billing review
  1st @ 10 AM - API key rotation (quarterly)
  1st @ 11 AM - Performance optimization

QUARTERLY:
  1st Mon - Full system audit (2-3 hours)
  1st Sat - Disaster recovery drill
```

---

## 12. Quick Reference Commands

```bash
# Health & Status
./scripts/health-check.sh           # Quick health check
fly status -a infamous-freight-api  # Service status
git log --oneline -10               # Recent commits

# Monitoring
watch -n 30 './scripts/health-check.sh'  # Continuous monitoring
# Open dashboards:
# - GitHub Actions: https://github.com/MrMiless44/Infamous-freight/actions
# - Vercel: https://vercel.com/dashboard
# - Sentry: https://sentry.io/organizations/infamous-freight
# - Datadog: https://app.datadoghq.com

# Operations
fly apps restart infamous-freight-api    # Restart service
fly scale count cli=2 -a infamous-freight-api  # Scale service
pnpm audit                               # Check vulnerabilities
pnpm test                                # Run tests

# Deployments
git push origin main                 # Trigger auto-deployment
git revert HEAD && git push          # Rollback last deploy

# Database
psql $DATABASE_URL -c "SELECT 1;"   # Test connection
```

---

**Keep this runbook at hand during shifts.**

**Last Updated**: February 19, 2026  
**Review Schedule**: Monthly  
**Next Review**: March 19, 2026

For emergencies, see: [INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md](INCIDENT-RESPONSE-RUNBOOK-RECOMMENDED.md)
