# Incident Response Runbook

## 🚨 Emergency Contacts

- **On-Call Engineer**: +1-XXX-XXX-XXXX (PagerDuty)
- **DevOps Lead**: devops@infamous-freight.com
- **CTO**: cto@infamous-freight.com
- **Status Page**: https://status.infamous-freight.com

## 🔥 Critical Incidents

### API Service Down

**Symptoms:**
- Health check endpoint returns 5xx
- 0 requests/second in Grafana
- AlertManager firing "HighErrorRate5xx"

**Immediate Actions:**
1. Check service status: `docker ps | grep api`
2. View recent logs: `docker logs --tail=100 infamous-api`
3. Check resource usage: `docker stats infamous-api`
4. Verify database connectivity: `docker exec infamous-api nc -zv db 5432`

**Resolution Steps:**
```bash
# 1. Restart the service
docker-compose -f docker-compose.prod.yml restart api

# 2. If restart fails, rebuild and deploy
docker-compose -f docker-compose.prod.yml up -d --build api

# 3. Verify health
curl http://localhost:4000/api/health

# 4. Check for errors
docker logs -f infamous-api | grep ERROR
```

**Root Cause Analysis:**
- Check recent deployments in Git history
- Review error logs for stack traces
- Verify environment variables
- Check database migration status

---

### Database Connection Pool Exhausted

**Symptoms:**
- "Too many connections" errors
- P95 latency > 5 seconds
- AlertManager firing "DatabaseConnectionsHigh"

**Immediate Actions:**
1. Check active connections:
```sql
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

2. Kill idle connections:
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';
```

**Resolution Steps:**
```bash
# 1. Increase connection pool size (temporary)
export DATABASE_URL="${DATABASE_URL}?connection_limit=50"
docker-compose -f docker-compose.prod.yml restart api

# 2. Scale API horizontally
docker-compose -f docker-compose.prod.yml up -d --scale api=5

# 3. Monitor connection usage
watch -n 5 'docker exec db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"'
```

**Prevention:**
- Configure proper connection pool limits in Prisma
- Implement connection timeout policies
- Monitor connection usage proactively

---

### Redis Cache Down

**Symptoms:**
- Cache hit rate drops to 0%
- API latency increases significantly
- AlertManager firing "RedisCacheDown"

**Immediate Actions:**
1. Check Redis status: `docker ps | grep redis`
2. Test Redis connection: `docker exec redis redis-cli ping`
3. Check memory usage: `docker exec redis redis-cli INFO memory`

**Resolution Steps:**
```bash
# 1. Restart Redis
docker-compose -f docker-compose.prod.yml restart redis

# 2. If memory issue, flush cache
docker exec redis redis-cli FLUSHALL

# 3. Check persistence
docker exec redis redis-cli CONFIG GET save

# 4. Verify API can connect
docker exec api node -e "const redis = require('redis'); const client = redis.createClient(); client.ping();"
```

**Fallback Mode:**
- API should degrade gracefully without cache
- Monitor API response times
- Scale API horizontally if needed

---

### High Memory Usage

**Symptoms:**
- Memory usage > 90%
- OOMKiller killing processes
- AlertManager firing "HighMemoryUsage"

**Immediate Actions:**
1. Identify memory hogs:
```bash
docker stats --no-stream | sort -k 4 -h
```

2. Check for memory leaks:
```bash
docker exec api node -e "console.log(process.memoryUsage())"
```

**Resolution Steps:**
```bash
# 1. Restart high-memory service
docker-compose -f docker-compose.prod.yml restart <service>

# 2. Scale horizontally instead of vertically
docker-compose -f docker-compose.prod.yml up -d --scale api=4

# 3. Clear cache if Redis is consuming too much
docker exec redis redis-cli FLUSHDB

# 4. Restart all services if necessary
docker-compose -f docker-compose.prod.yml restart
```

**Long-term Fix:**
- Profile application for memory leaks
- Implement memory limits in docker-compose
- Configure garbage collection properly

---

## ⚠️ Warning-Level Incidents

### Slow Response Times

**Threshold:** P95 > 500ms

**Investigation:**
1. Check Grafana "API Response Time" panel
2. Identify slow endpoints in logs
3. Check database query performance:
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Resolution:**
- Add database indexes if needed
- Implement caching for slow queries
- Optimize N+1 query problems

---

### Low Cache Hit Rate

**Threshold:** < 50%

**Investigation:**
1. Check cache key patterns: `docker exec redis redis-cli --scan --pattern '*'`
2. Review TTL configuration
3. Check for cache invalidation patterns

**Resolution:**
- Adjust TTL values in `cacheService.js`
- Review cache invalidation logic
- Consider warming cache on startup

---

### High Error Rate

**Threshold:** 5xx errors > 1%

**Investigation:**
1. Check error logs: `docker logs api | grep 'status":5'`
2. Review Sentry for error patterns
3. Check recent deployments

**Resolution:**
- Rollback if recent deployment caused issues
- Fix identified bugs
- Add error handling for edge cases

---

## 🔧 Common Tasks

### Deploy New Version

```bash
# 1. Pull latest code
git pull origin main

# 2. Build images
docker-compose -f docker-compose.prod.yml build

# 3. Run database migrations
cd apps/api && pnpm prisma:migrate:deploy

# 4. Deploy with zero-downtime
docker-compose -f docker-compose.prod.yml up -d --no-deps --build api web

# 5. Verify deployment
curl http://localhost:4000/api/health
curl http://localhost:3000

# 6. Monitor logs for errors
docker-compose -f docker-compose.prod.yml logs -f api web
```

### Rollback Deployment

```bash
# 1. Identify last working commit
git log --oneline -10

# 2. Checkout previous version
git checkout <commit-hash>

# 3. Rebuild and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Verify rollback
curl http://localhost:4000/api/health
```

### Scale Services

```bash
# Scale API horizontally
docker-compose -f docker-compose.prod.yml up -d --scale api=5

# Verify all replicas are healthy
docker-compose -f docker-compose.prod.yml ps api
```

### Database Maintenance

```bash
# Run vacuum
docker exec db psql -U postgres -d infamous_freight -c "VACUUM ANALYZE;"

# Check database size
docker exec db psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('infamous_freight'));"

# Backup database
./scripts/backup-database.sh

# Restore from backup
gunzip -c /backups/infamous_freight_20240101_120000.sql.gz | \
  docker exec -i db psql -U postgres -d infamous_freight
```

---

## 📊 Monitoring & Alerts

### Key Dashboards

1. **Production Overview**: http://localhost:3001/d/production-overview
2. **API Metrics**: http://localhost:3001/d/api-dashboard
3. **Prometheus**: http://localhost:9090

### Alert Priorities

**P0 - Critical (Page immediately)**
- Service down
- Database down
- 5xx error rate > 5%

**P1 - High (Page during business hours)**
- High memory usage > 90%
- Slow response times P95 > 1s
- Database connections > 80%

**P2 - Medium (Email notification)**
- Cache hit rate < 50%
- Disk usage > 70%
- Failed backups

**P3 - Low (Slack notification)**
- API documentation out of date
- Deprecated endpoints still in use

---

## 🔐 Security Incidents

### Suspected DDoS Attack

**Symptoms:**
- Massive spike in request rate
- Single IP or range making excessive requests
- Rate limiters being triggered constantly

**Actions:**
1. Identify attacking IPs: `docker logs nginx | grep -E '429|503' | awk '{print $1}' | sort | uniq -c | sort -rn`
2. Block at Nginx level: Add to nginx.conf `deny <IP>;`
3. Enable CloudFlare DDoS protection
4. Contact hosting provider

### Unauthorized Access Attempt

**Symptoms:**
- Multiple failed login attempts
- Auth rate limit alerts
- Suspicious user agents

**Actions:**
1. Check audit logs: `docker logs api | grep 'Unauthorized'`
2. Block suspicious IPs
3. Force password reset for affected accounts
4. Review JWT tokens for compromise

---

## 📞 Escalation Path

1. **On-Call Engineer** (15 minutes)
2. **DevOps Lead** (30 minutes)
3. **Engineering Manager** (1 hour)
4. **CTO** (2 hours)

**When to escalate:**
- Incident not resolved within SLA
- Data loss or corruption detected
- Security breach confirmed
- Multiple services affected

---

## ✅ Post-Incident

### Actions Required

1. **Document Incident**
   - Write incident report with timeline
   - Identify root cause
   - Document resolution steps

2. **Post-Mortem Meeting**
   - Schedule within 48 hours
   - Include all stakeholders
   - Create action items

3. **Prevent Recurrence**
   - Implement monitoring for early detection
   - Add automated tests
   - Update runbooks

4. **Update Status Page**
   - Post incident summary
   - Communicate preventive measures
   - Thank users for patience

---

## 📚 Additional Resources

- [Architecture Documentation](../DOCUMENTATION_INDEX.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Security Hardening Guide](../SECURITY_HARDENING_GUIDE.md)
- [Performance Optimization](../PERFORMANCE_OPTIMIZATION.md)
