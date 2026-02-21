# 🔄 Quarterly Database Optimization Checklist

**Purpose:** Systematic review to maintain database performance  
**Frequency:** Every 3 months  
**Duration:** 4-6 hours per quarter  
**Owner:** Backend Lead + DevOps

---

## 📅 Schedule

- **Q1 2026:** March 1-7 ✅
- **Q2 2026:** June 1-7
- **Q3 2026:** September 1-7
- **Q4 2026:** December 1-7

---

## 📋 Pre-Optimization Checklist

### Environment Preparation
- [ ] Schedule maintenance window (low-traffic period)
- [ ] Notify team in #engineering 24h advance
- [ ] Take full database backup
- [ ] Verify backup integrity
- [ ] Set up monitoring dashboard
- [ ] Have rollback plan ready

### Data Collection
- [ ] Export slow query logs (last 90 days)
- [ ] Collect query statistics from Prisma
- [ ] Review Datadog APM traces
- [ ] Check current index usage
- [ ] Measure current table sizes
- [ ] Document baseline metrics

---

## 🔍 1. Slow Query Analysis

### Step 1: Extract Slow Queries

```bash
# Export slow queries from logs
cd apps/api
grep "Slow query" logs/combined.log > slow-queries-$(date +%Y-%m-%d).log

# Or from PostgreSQL
psql $DATABASE_URL -c "
  SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
  FROM pg_stat_statements
  WHERE mean_time > 500  -- Queries averaging >500ms
  ORDER BY mean_time DESC
  LIMIT 50;
" > slow-queries-pg.txt
```

### Step 2: Analyze Query Patterns

For each slow query, check:
- [ ] Query execution plan: `EXPLAIN ANALYZE SELECT ...`
- [ ] Missing indexes
- [ ] Table scan vs index scan
- [ ] Join strategy
- [ ] N+1 query patterns
- [ ] Unnecessary columns selected

### Step 3: Document Findings

```markdown
## Slow Query Report - Q[N] 2026

### Query 1: Shipment List with Driver Details
**Average Time:** 850ms
**Calls:** 12,450 times/day
**Issue:** Missing index on `shipments.driverId`
**Action:** Add index
**Priority:** HIGH

### Query 2: Analytics Dashboard
**Average Time:** 1,200ms
**Calls:** 450 times/day
**Issue:** Multiple sequential queries (N+1)
**Action:** Use DataLoader batch
**Priority:** MEDIUM
```

---

## 🏗️ 2. Index Optimization

### Step 1: Review Current Indexes

```sql
-- List all indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- Unused indexes
  AND schemaname = 'public';
```

### Step 2: Identify Missing Indexes

Check for:
- [ ] Foreign key columns without indexes
- [ ] Columns used in WHERE clauses frequently
- [ ] Columns used in JOIN conditions
- [ ] Columns used in ORDER BY
- [ ] Composite indexes for multi-column queries

### Step 3: Add Necessary Indexes

```prisma
// apps/api/prisma/schema.prisma

model Shipment {
  id          String   @id @default(cuid())
  driverId    String?
  status      String
  createdAt   DateTime @default(now())
  
  @@index([driverId])           // NEW: Foreign key index
  @@index([status])             // NEW: Filter index
  @@index([createdAt])          // NEW: Sorting index
  @@index([status, createdAt])  // NEW: Composite index
}
```

### Step 4: Remove Unused Indexes

```sql
-- Drop unused indexes (CAUTION: Test in staging first!)
DROP INDEX IF EXISTS "unused_index_name";
```

**Before removing:**
- [ ] Verify index truly unused (check 90 days of logs)
- [ ] Test in staging environment
- [ ] Monitor for 1 week before removing in production

---

## 📊 3. Query Pattern Analysis

### Step 1: Identify N+1 Queries

```bash
# Check for potential N+1 patterns
cd apps/api
grep -r "\.findMany\|\.findUnique" src/routes/**/*.js | wc -l
grep -r "\.map.*await" src/routes/**/*.js
```

### Step 2: Review Common Patterns

| Pattern | Occurrences | Optimized? | Action |
|---------|-------------|------------|--------|
| Get shipments with drivers | 1,200/day | ❌ No | Add DataLoader |
| Get user with shipments | 800/day | ✅ Yes | - |
| Get driver with stats | 600/day | ❌ No | Add aggregation |
| Search shipments | 2,000/day | ⚠️ Partial | Review indexes |

### Step 3: Optimize Identified Patterns

Example: Convert N+1 to DataLoader

```javascript
// ❌ BEFORE: N+1 query
const shipments = await prisma.shipment.findMany();
for (const shipment of shipments) {
  shipment.driver = await prisma.driver.findUnique({
    where: { id: shipment.driverId }
  });
}

// ✅ AFTER: DataLoader batch
const shipments = await prisma.shipment.findMany();
const drivers = await Promise.all(
  shipments.map(s => req.loaders.driverLoader.load(s.driverId))
);
```

---

## 🔧 4. Connection Pool Review

### Step 1: Check Current Settings

```javascript
// apps/api/prisma/client.js
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Current pool settings
  connectionLimit: 10,
});
```

### Step 2: Analyze Connection Usage

```sql
-- Check active connections
SELECT 
    count(*),
    state,
    wait_event_type
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state, wait_event_type;

-- Check connection pool exhaustion
SELECT 
    max_conn,
    used,
    res_for_super,
    max_conn - used - res_for_super AS available
FROM (
    SELECT count(*) AS used FROM pg_stat_activity
) t1,
(
    SELECT setting::int AS max_conn 
    FROM pg_settings 
    WHERE name = 'max_connections'
) t2,
(
    SELECT setting::int AS res_for_super 
    FROM pg_settings 
    WHERE name = 'superuser_reserved_connections'
) t3;
```

### Step 3: Optimize Pool Settings

Recommendations:
- **Development:** 2-10 connections
- **Staging:** 5-20 connections
- **Production:** 10-50 connections (based on traffic)

```env
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20"
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_CONNECTION_TIMEOUT=3000
```

---

## 📈 5. Table Statistics Update

### Step 1: Update Statistics

```sql
-- Analyze all tables (updates query planner statistics)
ANALYZE;

-- Analyze specific table
ANALYZE shipments;

-- Verbose output
ANALYZE VERBOSE users;
```

### Step 2: Vacuum Tables

```sql
-- Vacuum all tables (recovers space)
VACUUM;

-- Vacuum specific table
VACUUM shipments;

-- Full vacuum (locks table, use off-hours)
VACUUM FULL shipments;

-- Vacuum with analyze
VACUUM ANALYZE;
```

**Schedule:**
- `VACUUM ANALYZE`: Weekly (automated)
- `VACUUM FULL`: Quarterly (manual, during maintenance)

---

## 🗄️ 6. Table Size Analysis

### Step 1: Measure Table Sizes

```sql
-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- Index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) AS size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;
```

### Step 2: Identify Growth Patterns

| Table | Size (Q1) | Size (Q2) | Growth | Action |
|-------|-----------|-----------|--------|---------|
| shipments | 120 MB | 145 MB | +20% | Normal |
| tracking_events | 450 MB | 680 MB | +51% | Archive old data |
| audit_logs | 200 MB | 310 MB | +55% | Implement rotation |
| users | 15 MB | 18 MB | +20% | Normal |

### Step 3: Implement Data Retention

```sql
-- Archive old tracking events (>6 months)
CREATE TABLE tracking_events_archive_2025 AS
SELECT * FROM tracking_events 
WHERE created_at < '2025-07-01';

DELETE FROM tracking_events 
WHERE created_at < '2025-07-01';

-- Create partition for new data (future improvement)
```

---

## ⚡ 7. Performance Regression Check

### Step 1: Compare with Baseline

```markdown
## Q[N] 2026 Performance Comparison

### P95 Response Times
| Endpoint | Previous | Current | Change |
|----------|----------|---------|--------|
| GET /api/shipments | 180ms | 165ms | ✅ -8% |
| GET /api/shipments/:id | 85ms | 95ms | ⚠️ +12% |
| POST /api/shipments | 245ms | 220ms | ✅ -10% |
| GET /api/analytics | 850ms | 920ms | ❌ +8% |

### Slow Query Count
- **Previous:** 245 queries >500ms
- **Current:** 198 queries >500ms
- **Change:** ✅ -19%

### Database Load
- **CPU:** 45% avg (was 52%)
- **Memory:** 68% avg (was 65%)
- **Connections:** 25 avg (was 28)
```

### Step 2: Investigate Regressions

For any endpoint with >10% degradation:
- [ ] Review recent code changes
- [ ] Check for new N+1 queries
- [ ] Verify index usage
- [ ] Compare query plans
- [ ] Check for schema changes

---

## 🔒 8. Security Review

### Step 1: Check for SQL Injection Risks

```bash
# Search for raw SQL queries
cd apps/api
grep -r "prisma\.\$executeRaw\|prisma\.\$queryRaw" src/

# Review each raw query for proper parameterization
```

### Step 2: Review Access Patterns

```sql
-- Check for suspicious queries
SELECT 
    usename,
    query,
    state,
    query_start
FROM pg_stat_activity
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%';
```

### Step 3: Audit Database Permissions

```sql
-- List user privileges
SELECT 
    grantee,
    privilege_type,
    table_schema,
    table_name
FROM information_schema.role_table_grants
WHERE grantee != 'postgres';
```

---

## 📊 9. Monitoring Dashboard Update

### Step 1: Update Slow Query Alerts

```yaml
# Datadog alert configuration
alert_query: avg(last_5m):avg:postgresql.query.time{service:api} > 500
message: |
  Slow queries detected!
  
  Query time: {{value}}ms
  Threshold: 500ms
  
  Action: Review query logs and optimize
  
  @slack-engineering @pagerduty-on-call
```

### Step 2: Update Capacity Alerts

```yaml
# Database connection pool alert
alert_query: avg(last_5m):avg:postgresql.connections.used{} > 40
message: |
  Database connection pool usage HIGH
  
  Used: {{value}} connections
  Limit: 50 connections
  
  Action: Check for connection leaks
  
  @slack-devops
```

---

## 📝 10. Documentation & Reporting

### Step 1: Create Optimization Report

Template: `docs/database/optimization-Q[N]-2026.md`

```markdown
# Database Optimization Report - Q[N] 2026

## Summary
- **Date:** [Date]
- **Duration:** [Hours]
- **Database Version:** PostgreSQL 16.x
- **Schema Version:** [Prisma migration version]

## Improvements Made
1. Added index on `shipments.status` → 45% faster filtering
2. Optimized analytics query → 30% faster
3. Implemented DataLoader for drivers → 67% reduction in queries
4. Vacuumed tracking_events table → Recovered 120 MB

## Metrics
- Slow query count: 245 → 198 (-19%)
- Average response time: 185ms → 165ms (-11%)
- Database CPU: 52% → 45% (-13%)
- Space recovered: 450 MB

## Next Quarter Actions
- [ ] Implement partitioning for tracking_events
- [ ] Add materialized view for analytics
- [ ] Review and optimize audit_logs table
```

### Step 2: Update Team

```markdown
**Posted in #engineering:**

🗄️ Q[N] 2026 Database Optimization Complete!

✅ Added 4 new indexes
✅ Fixed 3 N+1 query patterns
✅ Reduced slow queries by 19%
✅ Improved response times by 11%
✅ Recovered 450 MB disk space

Full report: [link to doc]

Questions? DM @backend-lead
```

---

## ✅ Post-Optimization Checklist

### Validation
- [ ] All tests passing
- [ ] Smoke tests in production successful
- [ ] No error rate increase
- [ ] Response times improved or stable
- [ ] Database CPU/memory stable

### Documentation
- [ ] Optimization report created
- [ ] Team notified
- [ ] Runbook updated (if needed)
- [ ] Next quarter scheduled

### Monitoring
- [ ] Continue monitoring for 1 week
- [ ] Watch for unexpected behavior
- [ ] Track new slow queries
- [ ] Verify index usage

---

## 🎯 Success Criteria

Mark quarter as successful if:
- ✅ Slow query count reduced by >10%
- ✅ No performance regressions introduced
- ✅ All critical indexes added
- ✅ Connection pool optimized
- ✅ Documentation updated
- ✅ Team trained on changes

---

## 📞 Emergency Rollback

If optimization causes issues:

```bash
# 1. Rollback latest migration
cd apps/api
pnpm prisma:migrate:resolve --rolled-back [migration-name]

# 2. Drop newly added indexes
psql $DATABASE_URL -c "DROP INDEX IF EXISTS new_index_name;"

# 3. Restart API servers
fly deploy --image registry.fly.io/app:previous-version

# 4. Notify team
# Post in #engineering and #production-alerts
```

---

## 📚 Resources

### Tools
- **pgAdmin:** Visual query analysis
- **PgHero:** Database health dashboard
- **Datadog APM:** Distributed tracing
- **Prisma Studio:** Data exploration

### Documentation
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [DataLoader Pattern](https://github.com/graphql/dataloader)

### Internal Docs
- [Database Schema](apps/api/prisma/schema.prisma)
- [Query Monitoring](apps/api/src/middleware/queryMonitoring.js)
- [Batch Loaders](apps/api/src/services/batchLoaders.js)

---

**Last Run:** March 1, 2026 ✅  
**Next Run:** June 1, 2026  
**Owner:** @backend-lead
