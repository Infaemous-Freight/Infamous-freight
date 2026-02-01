# Post-Deployment Operations Guide

## First 24 Hours & Ongoing Maintenance

**Phase**: Post-Production Deployment  
**Timeline**: 24 hours - Continuous  
**Version**: 1.0.0

---

## 🎯 First 24 Hours: Deployment Window

### Hour 0-1: Initial Deployment

```bash
# 1. Execute blue-green switch
./scripts/switch-deployment.sh green

# 2. Verify all health checks
./scripts/healthcheck.sh --all

# 3. Monitor metrics in real-time
watch -n 5 'curl -s http://localhost:4000/api/health | jq ".services"'

# 4. Check Grafana dashboards
# Visit http://localhost:3001

# 5. Monitor logs
docker-compose logs -f api-green | grep -i error
```

### Hour 1-2: Verification Phase

```bash
# 1. Run validation checklist
cat DEPLOYMENT_VALIDATION_CHECKLIST.md | grep "^- \[" | wc -l
# Should show 45 items

# 2. Test critical user flows
./scripts/test-critical-paths.sh

# 3. Check error logs
docker-compose logs --tail=500 api-green | grep -i "error\|exception\|failed"

# 4. Verify no memory leaks
docker stats --no-stream | grep api-green

# 5. Check response times
for i in {1..10}; do
  time curl -s http://localhost:4000/api/health > /dev/null
done
```

### Hour 2-4: Stability Monitoring

```bash
# Keep dashboards open and monitored:
# 1. Grafana API Performance Dashboard
#    - Watch request rates
#    - Monitor error rates
#    - Check response times

# 2. Prometheus
#    - Verify metrics collection
#    - Check for any alert triggers

# 3. API Health Dashboard
#    - Review system metrics
#    - Verify service connectivity

# Continuous monitoring:
./scripts/healthcheck.sh --interval 60
```

### Hour 4-24: Observation Phase

```bash
# Continue monitoring but less frequently:
./scripts/healthcheck.sh --interval 300  # Every 5 minutes

# Daily tasks:
# 1. Check logs for errors
docker-compose logs --since 1h api-green | grep -i error | wc -l

# 2. Review Grafana dashboards
# - Note any anomalies
# - Compare with baseline

# 3. Check resource usage
docker stats --no-stream

# 4. Verify backup completed
ls -lh /backups/ | tail -1

# 5. No manual action needed if all green
```

---

## 📊 Ongoing Monitoring (After 24 Hours)

### Daily Tasks (Automated)

```bash
# Daily at 9 AM:
# 1. Health check script runs
./scripts/healthcheck.sh --daily

# 2. Backup completes
# (Check backup location for today's backup)

# 3. Log rotation completes
# (Check log file sizes)

# 4. Monitoring data collected
# (Query Prometheus for metrics)

# Daily at 5 PM:
# 1. Email report sent
# (Performance metrics for the day)

# 2. Alert summary
# (Any triggered alerts reviewed)
```

### Weekly Tasks (Manual)

```bash
# Every Monday:

# 1. Review last week's metrics
./scripts/generate-weekly-report.sh

# 2. Check error trends
docker-compose logs --since 7d | grep -i error | wc -l

# 3. Verify backups working
ls -lh /backups/ | wc -l
# Should show 7 recent backups

# 4. Update documentation
# Any procedures changed?
git diff --name-only origin/main

# 5. Review and rotate logs
ls -lh /var/log/infamous/ | head -10

# 6. Check security patches needed
pnpm outdated --long
```

### Monthly Tasks (Scheduled)

```bash
# First of each month:

# 1. Full backup verification
./scripts/verify-backup.sh --latest

# 2. Disaster recovery test
./scripts/test-restore.sh --dry-run

# 3. Performance review
./scripts/monthly-performance-report.sh

# 4. Security audit
docker scan --accept-license infamous-freight-enterprises:latest

# 5. Dependency updates
# - Update base images
# - Update npm dependencies
# - Test in staging first

# 6. Documentation review
# - Update procedures
# - Add new learnings
# - Remove outdated info

# 7. Team review
# - Discuss incidents
# - Plan improvements
# - Update training materials
```

---

## 🔍 Monitoring Dashboard Interpretation

### API Performance Dashboard

**What to Look For**:

- ✅ Request Rate: Stable (should match expected traffic)
- ✅ Error Rate: < 0.1%
- ✅ Response Times: P95 < 500ms
- ✅ No spikes in graphs

**Red Flags**:

- 🔴 Request rate suddenly drops → Possible connection issue
- 🔴 Error rate spikes → New errors in code
- 🔴 Response time increases → Database or resource issue
- 🔴 Connection errors → Network or service down

**Action**:

```bash
# If something unusual:
curl http://localhost:4000/api/health/details | jq
docker-compose logs api-green --tail=100 | grep -i error
```

### Database Health Dashboard

**What to Look For**:

- ✅ Active Connections: < 50
- ✅ Cache Hit Ratio: > 90%
- ✅ Query Latency: < 100ms
- ✅ Database Up: 1 (green)

**Red Flags**:

- 🔴 Connection count growing → Possible leak
- 🔴 Cache ratio dropping → Query pattern changed
- 🔴 Query latency increasing → Slow queries
- 🔴 Database Up = 0 → Database down

**Action**:

```bash
# If connections high:
docker-compose exec postgres psql -U postgres \
  -c "SELECT count(*) FROM pg_stat_activity;"

# If cache ratio low:
docker-compose exec postgres psql -U postgres \
  -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5;"
```

### Infrastructure Dashboard

**What to Look For**:

- ✅ CPU: < 50%
- ✅ Memory: < 70%
- ✅ Disk: > 20% free
- ✅ Network: Stable

**Red Flags**:

- 🔴 CPU > 80% sustained → Optimize code or scale
- 🔴 Memory growing → Possible leak
- 🔴 Disk < 15% free → Clean up or add storage
- 🔴 Network packet loss → Network issue

**Action**:

```bash
# If CPU high:
docker stats --no-stream

# If memory high:
docker-compose exec redis redis-cli info memory

# If disk full:
du -sh /* | sort -rh | head -10
```

### Blue-Green Deployment Dashboard

**What to Look For**:

- ✅ Both services healthy (1 = up)
- ✅ Active deployment shows traffic
- ✅ Error rates similar on both
- ✅ Response times comparable

**Red Flags**:

- 🔴 One service down → Service failed
- 🔴 Traffic only on one → Switch may be stuck
- 🔴 Error rate disparity → Version issue
- 🔴 Performance disparity → Resource contention

**Action**:

```bash
# Check deployment status:
./scripts/switch-deployment.sh status

# Check both services:
curl http://api-blue:4000/api/health/live
curl http://api-green:4000/api/health/live

# Check Nginx routing:
curl http://localhost:4000/api/health | jq '.upstream'
```

---

## 📈 Metrics to Track Long-Term

### Health Metrics

```
Daily:
- Uptime %
- Error rate %
- Average response time (ms)
- Peak response time (ms)

Weekly:
- Error trend
- Performance trend
- Resource usage trend
- Backup success %

Monthly:
- Incident count
- Mean time to recovery
- Performance baseline
- User impact hours
```

### Resource Metrics

```
Track for capacity planning:
- API container memory trend
- Database size growth
- Redis memory usage
- Disk usage rate
- Network bandwidth

Calculate:
- Monthly growth rate
- Projected capacity exhaustion
- Upgrade timeline needed
```

---

## 🚨 Common Issues First 24 Hours

### Issue: Slightly Higher Error Rate Than Baseline

**Likely Cause**: Code initialization, cache warming
**Action**: Wait 1-2 hours, errors should normalize
**If Not**: Investigate specific error types

### Issue: Memory Usage Higher Than Expected

**Likely Cause**: New data structures in code
**Action**: Monitor for 4-6 hours, should stabilize
**If Not**: Check for memory leaks

### Issue: Unexpected Slow Queries

**Likely Cause**: New database queries not optimized
**Action**: Collect slow query logs, optimize, redeploy

### Issue: Different Response Times on Blue vs Green

**Likely Cause**: Version differences, data inconsistency
**Action**: Verify both versions same, check data sync

---

## 📝 Daily Report Template

**Date**: ****\_\_\_****

### Metrics Summary

- Uptime: \_\_\_% (should be > 99.9%)
- Error Rate: \_\_% (should be < 0.1%)
- Avg Response Time: \_\_\_ms (should be < 300ms)
- P95 Response Time: \_\_\_ms (should be < 500ms)

### Incidents

```
None / [Description of incident]
- Duration: ___
- Impact: ___
- Resolution: ___
```

### Alerts Triggered

```
None / [List any alerts]
- Alert: ___
- Severity: ___
- Action Taken: ___
```

### Resource Usage

- CPU: \_\_% (should be < 50%)
- Memory: \_\_% (should be < 70%)
- Disk: \_\_% (should be > 80% free)

### Notes

- Any unusual patterns?
- Any performance improvements?
- Anything to investigate?

---

## When to Escalate

### If any of these occur, escalate immediately:

1. **Uptime drops below 99%**
   - Page on-call engineer
   - Investigate root cause
   - Implement immediate fix

2. **Error rate exceeds 1%**
   - Alert engineering team
   - Review error logs
   - May need rollback

3. **Response time exceeds 5 seconds**
   - Check database
   - Check resources
   - May need to scale

4. **Memory/CPU exceeding 85%**
   - Immediate action needed
   - Possible memory leak
   - May need restart

5. **Database unable to connect**
   - Critical issue
   - Check database health
   - Verify backups available

---

## Success Criteria: First 24 Hours

✅ **ALL of the following must be true**:

- [ ] System uptime ≥ 99.9%
- [ ] Error rate < 0.1%
- [ ] Response times stable
- [ ] No memory leaks detected
- [ ] Database healthy
- [ ] All dashboards showing data
- [ ] Backups completing successfully
- [ ] No critical errors in logs
- [ ] Users reporting normal function
- [ ] Team confidence in system

**If all criteria met**: Deployment successful ✅

**If any fail**: Investigate and potentially rollback

---

## Post-24-Hour Activities

### If Deployment Successful

1. [ ] Send "All Clear" to stakeholders
2. [ ] Schedule retrospective meeting
3. [ ] Document lessons learned
4. [ ] Update runbooks
5. [ ] Archive deployment logs
6. [ ] Plan Phase 2 improvements

### If Issues Found

1. [ ] Create tickets for each issue
2. [ ] Prioritize fixes
3. [ ] Plan rollback if critical
4. [ ] Schedule emergency deployment
5. [ ] Communicate timeline to users

---

## Ongoing Operational Procedures

### Weekly Operational Review

```bash
# Every Monday morning:

# 1. Check deployment status
./scripts/switch-deployment.sh status

# 2. Run health checks
./scripts/healthcheck.sh --all

# 3. Generate performance report
./scripts/generate-weekly-report.sh

# 4. Review and archive logs
find /var/log/infamous -mtime +7 -delete

# 5. Verify backups
ls -lh /backups/ | tail -7 | awk '{print $9, $5}'

# Expected output: 7 recent backups
```

### Monthly Maintenance Window

```bash
# Last Saturday of month (2 AM):

# 1. Update base images
docker pull postgres:16-alpine
docker pull redis:7-alpine
docker pull node:20-alpine

# 2. Run security scanning
trivy image --severity HIGH infamous-freight-enterprises:latest

# 3. Update dependencies (if testing passed)
pnpm update

# 4. Run full test suite
npm test

# 5. Backup before production
./scripts/backup-production.sh

# 6. Deploy updates (if tests passed)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --pull always

# 7. Verify no issues
./scripts/healthcheck.sh --all
```

---

**Version**: 1.0.0  
**Status**: ✅ Ready for Operations  
**Last Updated**: January 2026
