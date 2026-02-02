# Incident Response & Troubleshooting Playbook

## Infamous Freight Enterprises - Production Support

**Version**: 1.0.0  
**Status**: Active  
**Last Updated**: January 2026

---

## Quick Reference: Common Issues

### Issue: API Not Responding

```bash
# Step 1: Check container status
docker-compose ps api-blue api-green

# Step 2: Check logs
docker-compose logs api-blue --tail 50 | grep -i error

# Step 3: Test health endpoint
curl http://api-blue:4000/api/health

# Step 4: Check database connectivity
docker-compose exec api-blue npm run db:verify

# Step 5: If blue down, check green
curl http://api-green:4000/api/health

# Step 6: If both down, ROLLBACK
./scripts/switch-deployment.sh rollback
```

### Issue: High Response Times (> 1 second)

```bash
# Step 1: Check database connections
docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Step 2: Check slow queries
docker-compose exec postgres psql -U postgres -c \
  "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5;"

# Step 3: Check Redis memory
docker-compose exec redis redis-cli info memory

# Step 4: Check API logs for slow operations
docker-compose logs api-blue | grep -i "duration" | tail -20

# Step 5: If issue persists, switch to green
./scripts/switch-deployment.sh green
```

### Issue: Memory Usage Exceeding Limits

```bash
# Step 1: Check current usage
docker stats --no-stream

# Step 2: Identify memory leak
docker-compose logs api-blue | grep -i "memory\|heap"

# Step 3: Check for leaked connections
docker-compose exec postgres psql -U postgres -c \
  "SELECT usename, count(*) FROM pg_stat_activity GROUP BY usename;"

# Step 4: Restart problematic service
docker-compose restart api-blue

# Step 5: Monitor for recurrence
docker stats --no-stream api-blue

# Step 6: If memory still growing, ROLLBACK
./scripts/switch-deployment.sh rollback
```

### Issue: Database Connection Pool Exhausted

```bash
# Step 1: Check connection count
docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Step 2: Identify idle connections
docker-compose exec postgres psql -U postgres -c \
  "SELECT * FROM pg_stat_activity WHERE state = 'idle';"

# Step 3: Kill idle connections
docker-compose exec postgres psql -U postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '5 minutes';"

# Step 4: Restart API to reset connection pool
docker-compose restart api-blue

# Step 5: Monitor connections
docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;" | watch -n 5
```

---

## Incident Response Procedures

### Severity 1: Complete System Down

**Detection**: All health checks failing, users unable to access service

**Immediate Actions** (First 5 minutes):

1. [ ] Declare incident in Slack #incidents
2. [ ] Page on-call team
3. [ ] Check if GREEN is healthy
4. [ ] If green healthy: `./scripts/switch-deployment.sh green`
5. [ ] If both down: Revert to last known good state
6. [ ] Notify stakeholders of status

**Diagnosis** (5-15 minutes):

```bash
# Run full health check
./scripts/healthcheck.sh --all

# Check all services
docker-compose ps

# Review recent logs
docker-compose logs --tail=200 | tee /tmp/incident.log

# Check infrastructure
df -h  # Disk space
free -h  # Memory
top -b -n 1 | head -20  # CPU/Process info
```

**Recovery**:

```bash
# Option 1: Switch deployment
./scripts/switch-deployment.sh green

# Option 2: Restart services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Option 3: Full restart
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Post-Incident**:

- [ ] Document what happened
- [ ] Create timeline
- [ ] Identify root cause
- [ ] Create ticket for fix
- [ ] Schedule retrospective

---

### Severity 2: Degraded Performance

**Detection**: Response times > 500ms, error rate > 0.5%, users report slowness

**Immediate Actions**:

1. [ ] Alert team in Slack
2. [ ] Check monitoring dashboards
3. [ ] Identify affected services
4. [ ] Document baseline metrics

**Diagnosis**:

```bash
# Check which service is slow
curl http://localhost:4000/api/health/details | jq '.responseTime'

# Check database
./scripts/healthcheck.sh database

# Check Redis
docker-compose exec redis redis-cli info stats

# Check infrastructure
docker stats --no-stream

# Query Prometheus for trends
curl "http://localhost:9090/api/v1/query?query=rate(http_request_duration_ms[5m])" | jq
```

**Mitigation**:

1. Identify bottleneck (DB/Cache/API)
2. Scale up if needed
3. Switch to green if blue affected
4. Implement circuit breaker
5. Rate limit if under load

**Resolution Timeline**: Target < 30 minutes

---

### Severity 3: Minor Issues

**Detection**: Isolated errors, specific feature broken, non-critical alert

**Immediate Actions**:

1. [ ] Create ticket in tracking system
2. [ ] Document issue
3. [ ] Add to known issues list

**Investigation**:

- Review logs related to feature
- Check for recent code changes
- Test with same input data
- Identify workaround for users

**Resolution Timeline**: Target < 4 hours

---

## Troubleshooting Decision Tree

```
Service Not Responding?
├─ YES → Check docker-compose ps
│  ├─ Container down → docker-compose up -d
│  ├─ Container running → Check logs
│  │  ├─ OOM error → Increase memory limit
│  │  ├─ Connection error → Check network
│  │  └─ Other error → Debug from logs
│  └─ Container crashed → Review last 100 lines
│
├─ NO (responding but errors)
│  ├─ Check API health endpoint
│  ├─ Database down? → Database troubleshooting
│  ├─ Memory high? → Kill idle connections / Restart
│  └─ CPU high? → Check slow queries
│
└─ Partial outage
   ├─ Switch to green: ./scripts/switch-deployment.sh green
   └─ Investigate blue offline
```

---

## Rollback Procedures

### Quick Rollback (< 1 minute)

```bash
# Check current active
./scripts/switch-deployment.sh status

# If on green, switch to blue
./scripts/switch-deployment.sh blue

# Verify
curl http://localhost:4000/api/health | jq '.status'
```

### Full Rollback (5-10 minutes)

```bash
# Stop new version
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down api-green

# Restart old version
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d api-blue

# Switch traffic
./scripts/switch-deployment.sh blue

# Verify all services
./scripts/healthcheck.sh --all
```

### Emergency Rollback (Complete)

```bash
# Stop everything
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Restore from backup (if needed)
./scripts/restore-backup.sh latest

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify
./scripts/healthcheck.sh --all
```

---

## Monitoring & Alerting

### What to Monitor

1. **Availability**: Should always be 99.9%+
2. **Response Time**: P95 should be < 500ms
3. **Error Rate**: Should be < 0.1%
4. **CPU**: Should stay < 70%
5. **Memory**: Should stay < 80%
6. **Disk**: Should stay > 20% free
7. **Database Connections**: Should be < 80/100

### Alert Thresholds

| Metric              | Warn       | Critical   |
| ------------------- | ---------- | ---------- |
| Error Rate          | > 0.5%     | > 1%       |
| Response Time (P95) | > 1s       | > 5s       |
| CPU                 | > 70%      | > 90%      |
| Memory              | > 80%      | > 95%      |
| Disk                | < 20% free | < 10% free |
| DB Connections      | > 70       | > 90       |
| Uptime              | < 99.5%    | < 99%      |

### Setting Up Alerts in Grafana

```
1. Go to http://localhost:3001
2. Dashboards → Select Dashboard
3. Panel → Edit → Alert
4. Set condition (e.g., "when avg > 1000")
5. Set evaluation frequency (e.g., every 1m)
6. Add notification channel
7. Save
```

---

## Performance Tuning

### If Response Times are High

```bash
# 1. Check database slow queries
docker-compose exec postgres psql -U postgres \
  -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 2. Check query plan
docker-compose exec postgres psql -U postgres \
  -c "EXPLAIN ANALYZE SELECT * FROM shipments LIMIT 100;"

# 3. Add missing indexes
docker-compose exec postgres psql -U postgres \
  -c "CREATE INDEX idx_shipments_status ON shipments(status);"

# 4. Check Redis cache hits
docker-compose exec redis redis-cli info stats | grep keyspace_hits

# 5. Increase cache size or TTL
```

### If Memory Usage is High

```bash
# 1. Check for leaks
docker-compose logs api-blue | grep -i "memory\|heap" | tail -20

# 2. Identify large objects in memory
docker-compose exec redis redis-cli --bigkeys

# 3. Reduce cache size
docker-compose exec redis redis-cli CONFIG SET maxmemory 256mb

# 4. Enable eviction policy
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 5. Restart service
docker-compose restart api-blue
```

### If CPU Usage is High

```bash
# 1. Identify hot code paths
docker-compose logs api-blue | grep "duration" | sort -t: -k3 -rn | head -10

# 2. Check background jobs
docker-compose exec postgres psql -U postgres \
  -c "SELECT query, calls FROM pg_stat_statements ORDER BY calls DESC LIMIT 10;"

# 3. Reduce polling frequency
# Edit configuration and restart

# 4. Implement caching
# Add Redis caching for frequently accessed data

# 5. Scale horizontally
# Run multiple API instances behind load balancer
```

---

## Escalation Matrix

| Issue Type              | 15 min Response | Escalate To                  |
| ----------------------- | --------------- | ---------------------------- |
| API Down                | CRITICAL        | Engineering Lead + Ops Lead  |
| DB Down                 | CRITICAL        | DBA + Ops Lead + Engineering |
| High Error Rate         | Page On-Call    | Engineering Team             |
| Performance Degradation | Alert Team      | Performance Team             |
| Security Alert          | CRITICAL        | Security Team + All Leads    |
| Data Loss               | CRITICAL        | All Leads + Management       |

---

## Post-Incident Review

After any Severity 1 incident:

1. **Timeline**: What happened when?

```
14:00 - User report: Slow API
14:05 - Team paged, checked dashboards
14:10 - Identified database as bottleneck
14:15 - Switched to green deployment
14:20 - Services normalized
14:30 - All clear notification
```

1. **Root Cause**: Why did it happen?
   - Unoptimized query added in last deployment
   - No load testing before production
   - Alert threshold too high

2. **Impact**: What was affected?
   - API latency increased to 5+ seconds
   - 2% of requests failed
   - ~50 users affected
   - Duration: 20 minutes

3. **What Went Well**: What did we do right?
   - Quick detection via monitoring
   - Fast rollback available
   - Team communicated well
   - Minimal user impact

4. **What to Improve**: Lessons learned?
   - Add performance tests to CI/CD
   - Lower alert thresholds
   - Document deployment risks
   - Practice rollback procedures

5. **Action Items**: What's next?
   - [ ] Optimize database queries (Owner: DBA)
   - [ ] Add load testing (Owner: QA)
   - [ ] Update alert rules (Owner: Ops)
   - [ ] Schedule training on new tools (Owner: Team Lead)

---

## Support Resources

**During Incident**:

- Documentation: `./MONITORING_STACK_SETUP.md`
- Procedures: `./BLUE_GREEN_DEPLOYMENT_PROCEDURE.md`
- Dashboards: <http://localhost:3001>
- Prometheus: <http://localhost:9090>

**After Incident**:

- Create ticket in tracking system
- Post summary in #incidents Slack channel
- Schedule 1-hour retrospective
- Update runbooks based on learnings

---

**Status**: ✅ Production Ready  
**Maintained By**: Operations Team  
**Last Reviewed**: January 2026
