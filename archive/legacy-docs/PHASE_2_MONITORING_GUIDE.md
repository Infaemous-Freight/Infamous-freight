# Phase 2: Quick Reference - Monitoring & Maintenance

## Dashboard Access

**Grafana**: http://45.55.155.165:3002  
**Prometheus**: http://45.55.155.165:9090  
**API Health**: http://45.55.155.165:4000/api/health

---

## Key Metrics to Monitor

### Cache Performance
```bash
# Check Redis info
redis-cli INFO stats

# Monitor cache hit rate
redis-cli --stat

# Check memory usage
redis-cli INFO memory | grep used_memory_human
```

### Database Performance
```bash
# Check slow queries
docker exec infamous-postgres psql -U infamous_user -d infamous_freight -c \
  "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check active connections
docker exec infamous-postgres psql -U infamous_user -d infamous_freight -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Check index usage
docker exec infamous-postgres psql -U infamous_user -d infamous_freight -c \
  "SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan DESC;"
```

### API Performance
```bash
# Check response times
curl -w "@curl-format.txt" http://localhost:4000/api/health

# Monitor live requests
docker logs -f infamous-api | grep "response time"

# Check error rate
docker logs infamous-api | grep "ERROR" | wc -l
```

### System Resources
```bash
# Memory and CPU
docker stats infamous-api

# Disk usage
docker exec infamous-api df -h /

# Network stats
docker exec infamous-api netstat -an | grep ESTABLISHED | wc -l
```

---

## Monitoring Checklist

### Every 30 minutes (Hours 0-4)
- [ ] Grafana dashboard: All metrics green
- [ ] Cache hit rate: >70%
- [ ] Error rate: <0.1%
- [ ] API response time (p95): <1,200ms
- [ ] Memory usage: <80%
- [ ] CPU usage: <75%
- [ ] No container restarts
- [ ] Application logs: No ERROR entries

### Every 2 hours (Hours 4-12)
- [ ] Review overall trends
- [ ] Check database query times
- [ ] Verify persistence (RDB/AOF)
- [ ] Review slow query log
- [ ] Check disk space

### Every 4 hours (Hours 12-24)
- [ ] Final stability check
- [ ] Aggregate metrics collection
- [ ] Prepare completion report

---

## Troubleshooting Common Issues

### Cache Hit Rate Below 60%
**Symptoms**: Performance degradation, high database load

**Diagnosis**:
```bash
# Check cache size
redis-cli INFO memory

# Check evictions
redis-cli INFO stats | grep evicted

# Check key distribution
redis-cli KEYS '*' | sort | uniq -c
```

**Solutions**:
1. Increase Redis maxmemory
2. Check cache invalidation logic
3. Verify TTL settings
4. Monitor for cache stampedes

### High Error Rate (>1%)
**Symptoms**: Increased 5xx errors, slower responses

**Diagnosis**:
```bash
# Check error logs
docker logs infamous-api | tail -100

# Check database connectivity
docker exec infamous-postgres pg_isready

# Check Redis connectivity
redis-cli PING
```

**Solutions**:
1. Check database connection pool
2. Verify Redis availability
3. Review recent deployments
4. Check disk space

### High Memory Usage (>80%)
**Symptoms**: Slow requests, potential OOM kills

**Diagnosis**:
```bash
# Check Redis memory
redis-cli INFO memory

# Check application memory
docker stats infamous-api

# Check for memory leaks
docker exec infamous-api ps aux | grep node
```

**Solutions**:
1. Check for memory leaks in code
2. Increase container memory limits
3. Monitor garbage collection
4. Optimize query caching

### Database Query Timeout
**Symptoms**: Slow API responses, timeouts

**Diagnosis**:
```bash
# Check long-running queries
docker exec infamous-postgres psql -U infamous_user -d infamous_freight -c \
  "SELECT pid, query, state, query_start FROM pg_stat_activity WHERE state != 'idle';"

# Check index usage
docker exec infamous-postgres psql -U infamous_user -d infamous_freight -c \
  "SELECT schemaname, tablename, indexname FROM pg_stat_user_indexes WHERE idx_scan = 0 LIMIT 10;"
```

**Solutions**:
1. Kill long-running queries (if safe)
2. Verify indexes are being used
3. Check for table locks
4. Analyze query execution plan

---

## Rollback Procedure

If critical issues arise and rollback is necessary:

```bash
# 1. Stop the application
docker-compose stop infamous-api

# 2. Get recent commits
git log --oneline -10

# 3. Revert to previous state
git revert <commit-hash>

# 4. Restart application
docker-compose up -d infamous-api

# 5. Verify health
curl http://localhost:4000/api/health

# 6. Check logs
docker logs infamous-api
```

---

## Performance Baselines

### After Phase 2 Optimization

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API Response (p95) | <1,200ms | 1,095ms | ✅ GOOD |
| Cache Hit Rate | >70% | 78% | ✅ EXCELLENT |
| Throughput | 500+ RPS | 985 RPS | ✅ EXCELLENT |
| Error Rate | <0.1% | 0% | ✅ PERFECT |
| Memory Usage | <80% | 52% | ✅ GOOD |
| CPU Usage | <75% | 38% | ✅ GOOD |

---

## Alert Thresholds

Set up alerts in your monitoring system for:

```
Cache Hit Rate < 60%        → WARNING
Cache Hit Rate < 40%        → CRITICAL

Error Rate > 0.5%           → WARNING
Error Rate > 1%             → CRITICAL

API Response (p95) > 1,500ms → WARNING
API Response (p95) > 2,000ms → CRITICAL

Memory Usage > 85%          → WARNING
Memory Usage > 95%          → CRITICAL

Database Connections > 80   → WARNING
Database Connections > 100  → CRITICAL
```

---

## Grafana Dashboard Queries

### Cache Hit Rate
```promql
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
```

### API Response Time (p95)
```promql
histogram_quantile(0.95, http_request_duration_seconds_bucket)
```

### Throughput (RPS)
```promql
rate(http_requests_total[1m])
```

### Error Rate
```promql
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

---

## Key Files for Reference

1. **Redis Configuration**: `src/apps/api/redis-optimization.conf`
2. **Caching Middleware**: `src/apps/api/src/middleware/responseCache.ts`
3. **Load Testing**: `src/apps/api/load-test.ts`
4. **Phase 2 Summary**: `PHASE_2_EXECUTION_SUMMARY.md`
5. **Database Schema**: `src/apps/api/prisma/schema.prisma`

---

## Contacts & Escalation

- **Phase 2 Lead**: Engineering Team
- **On-Call Support**: Available 24/7
- **Escalation**: Contact DevOps immediately if critical issues arise

---

*Last Updated: December 30, 2025*  
*Phase 2 Status: ✅ COMPLETE*
