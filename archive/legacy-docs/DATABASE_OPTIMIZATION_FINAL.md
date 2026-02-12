# Database Optimization & Performance Tuning Guide

## Overview

This guide covers PostgreSQL optimization, query performance, connection pooling, and scaling strategies for the Infamous Freight Enterprises platform.

---

## 1. Index Strategy

### Current Indexes

All indexes are defined in [apps/api/prisma/schema.prisma](../apps/api/prisma/schema.prisma).

#### User Indexes
```sql
-- ✅ Email lookup (login, unique constraint)
CREATE UNIQUE INDEX idx_user_email ON users(email);

-- ✅ Role-based queries (admin filtering)
CREATE INDEX idx_user_role ON users(role);

-- ✅ Created date range queries (user analytics)
CREATE INDEX idx_user_created_at ON users(created_at DESC);
```

#### Shipment Indexes
```sql
-- ✅ User shipments (most common query)
CREATE INDEX idx_shipment_user_id ON shipments(user_id);

-- ✅ Status-based filtering (dashboard)
CREATE INDEX idx_shipment_status ON shipments(status);

-- ✅ Combined index for common query pattern
CREATE INDEX idx_shipment_user_status ON shipments(user_id, status);

-- ✅ Recent shipments (created date)
CREATE INDEX idx_shipment_created_at ON shipments(created_at DESC);

-- ✅ Driver assignment queries
CREATE INDEX idx_shipment_driver_id ON shipments(driver_id);

-- ✅ Full-text search index (future)
CREATE INDEX idx_shipment_origin_trgm ON shipments USING GIN(origin gin_trgm_ops);
CREATE INDEX idx_shipment_dest_trgm ON shipments USING GIN(destination gin_trgm_ops);
```

#### Payment Indexes
```sql
-- ✅ User payment history
CREATE INDEX idx_payment_user_id ON payments(user_id);

-- ✅ Payment status queries
CREATE INDEX idx_payment_status ON payments(status);

-- ✅ Stripe integration lookups
CREATE INDEX idx_payment_stripe_id ON payments(stripe_payment_intent_id);

-- ✅ Date range queries (reporting)
CREATE INDEX idx_payment_created_at ON payments(created_at DESC);
```

#### Audit Log Indexes
```sql
-- ✅ User activity tracking
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);

-- ✅ Action type queries (security analysis)
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ✅ Time-based queries
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- ✅ Combined index for common query pattern
CREATE INDEX idx_audit_user_action_date ON audit_logs(user_id, action, created_at DESC);
```

### Index Maintenance

#### Reindexing (Monthly)
```sql
-- Reindex all tables to prevent index bloat
REINDEX DATABASE "freight_db";

-- Or specific table:
REINDEX TABLE shipments;
```

#### Analyze Query Plans (When Performance Degrades)
```sql
-- Enable query plan analysis
EXPLAIN ANALYZE
SELECT * FROM shipments 
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
AND status = 'in_transit';

-- Should use: idx_shipment_user_status
```

#### Find Missing Indexes
```sql
-- Identify unused indexes (waste space)
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Drop unused indexes:
-- DROP INDEX idx_name;
```

#### Find Slow Queries
```sql
-- Enable slow query log
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 second
SELECT pg_reload_conf();

-- Check log file:
-- tail -f /var/log/postgresql/postgresql.log | grep "duration:"
```

---

## 2. Query Optimization

### Problem: N+1 Queries

**❌ Bad Pattern**:
```javascript
// Fetches shipment, then loops and fetches each driver (N+1)
const shipments = await prisma.shipment.findMany();
for (const s of shipments) {
  s.driver = await prisma.user.findUnique({ where: { id: s.driverId } });
}
```

**✅ Good Pattern**:
```javascript
// Fetch shipments with drivers in one query
const shipments = await prisma.shipment.findMany({
  include: { driver: true },
});
```

### Problem: Large Result Sets

**❌ Bad Pattern**:
```javascript
// Fetches all 100,000 shipments
const all = await prisma.shipment.findMany();
```

**✅ Good Pattern**:
```javascript
// Paginate results
const page = await prisma.shipment.findMany({
  skip: (pageNum - 1) * 50,
  take: 50,
  orderBy: { createdAt: 'desc' },
});
```

### Problem: Unnecessary Fields

**❌ Bad Pattern**:
```javascript
// Fetches all fields including large JSONB metadata
const users = await prisma.user.findMany();
```

**✅ Good Pattern**:
```javascript
// Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    // Skip: metadata, password, etc.
  },
});
```

### Common Query Patterns

#### Filter by User and Status
```javascript
// Uses index: idx_shipment_user_status
const shipments = await prisma.shipment.findMany({
  where: {
    userId: req.user.id,
    status: 'pending',
  },
});
```

#### Recent Activity with Pagination
```javascript
// Uses indexes: idx_shipment_created_at, idx_shipment_user_id
const shipments = await prisma.shipment.findMany({
  where: { userId: req.user.id },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 50,
});
```

#### Full-Text Search
```javascript
// Uses GIN indexes for fast full-text search
const results = await prisma.shipment.findMany({
  where: {
    OR: [
      { origin: { search: 'New York' } },
      { destination: { search: 'Los Angeles' } },
    ],
  },
});
```

#### Aggregation Queries
```javascript
// Count shipments by status
const stats = await prisma.shipment.groupBy({
  by: ['status'],
  _count: { status: true },
});
// Returns: [{ status: 'pending', _count: { status: 42 } }, ...]
```

---

## 3. Connection Pooling

### Current Configuration

```javascript
// apps/api/src/db/prisma.js
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Connection pool configured in DATABASE_URL
// Format: postgresql://user:password@host:port/db?schema=public
```

### Optimal Pool Settings

```
// .env
DATABASE_URL="postgresql://user:pass@localhost/db?schema=public&connection_limit=20&pool_timeout=10"

// Connection limit = (CPU cores * 2) + spare
// For 4-core: limit=10, For 8-core: limit=18, For 16-core: limit=34
```

### Pool Monitoring

```javascript
// Check active connections
const poolMetrics = await prisma.$metrics?.db?.connection;
console.log(poolMetrics);
// { active: 8, idle: 2, waiting: 0 }
```

### Connection Limit Issues

**Symptom**: `too many connections` error
```bash
# Check current connections
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle'
AND pid != pg_backend_pid()
LIMIT 10;
```

---

## 4. Database Scaling

### Vertical Scaling (Single Server)
1. Increase RAM (more buffer cache)
2. Upgrade CPU (faster query processing)
3. Use NVMe SSD (faster disk I/O)

**Configuration**:
```sql
-- /etc/postgresql/postgresql.conf

-- RAM-based tuning (for 16GB server)
shared_buffers = 4GB           -- 25% of RAM
effective_cache_size = 12GB    -- 75% of RAM
maintenance_work_mem = 1GB
work_mem = 50MB

-- Connection tuning
max_connections = 100
max_parallel_workers = 8
max_wal_size = 2GB
```

### Horizontal Scaling (Read Replicas)

#### Setup Replica for Read-Only Queries
```bash
# Primary: PostgreSQL on Fly.io (production database)
# Replica: Read-only replica for reporting queries

# Connection string for reads:
REPLICA_DB_URL="postgresql://user:pass@replica.fly.dev/db"

# Connection string for writes:
PRIMARY_DB_URL="postgresql://user:pass@primary.fly.dev/db"
```

#### Route Queries to Appropriate Database
```javascript
// Writing (shipment creation, payment processing)
const primary = new PrismaClient({
  datasources: { db: { url: process.env.PRIMARY_DB_URL } },
});

// Reading (dashboards, reports)
const replica = new PrismaClient({
  datasources: { db: { url: process.env.REPLICA_DB_URL } },
});

// Usage
await primary.shipment.create({ data });      // Write to primary
const list = await replica.shipment.findMany(); // Read from replica
```

---

## 5. Monitoring & Metrics

### Key Metrics to Track

#### Query Performance
```sql
-- Average query time
SELECT mean_exec_time FROM pg_stat_statements
WHERE query LIKE '%SELECT%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Total time spent in each query
SELECT query, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

#### Cache Hit Ratio (Target: >99%)
```sql
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

#### Index Hit Ratio
```sql
SELECT
  schemaname,
  tablename,
  idx_scan,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Connection Pool Usage
```sql
SELECT
  datname,
  usename,
  state,
  count(*) as count
FROM pg_stat_activity
GROUP BY datname, usename, state;
```

### Alerting Rules

| Alert | Threshold | Action |
|-------|-----------|--------|
| High CPU | >80% | Scale up resources |
| Slow Queries | >1s | Review query plan, add indexes |
| Connection Pool Full | >90% | Increase pool size |
| Disk Space | >80% | Archive old data, add storage |
| Memory | >85% | Increase shared_buffers |
| High I/O Wait | >30% | Upgrade to faster disk |

---

## 6. Maintenance Tasks

### Daily
- Monitor slow query log
- Check connection pool usage
- Verify backups completed

### Weekly
- Analyze table statistics: `ANALYZE;`
- Vacuum tables: `VACUUM ANALYZE;`
- Check for unused indexes

### Monthly
- Full REINDEX of large tables
- Review query performance trends
- Update table statistics

### Quarterly
- Backup integrity testing
- Performance baseline review
- Upgrade to latest PostgreSQL patch

### Annually
- Major version upgrade (PostgreSQL)
- Security audit
- Capacity planning for next year

---

## 7. Backup & Recovery

### Backup Strategy

```bash
# Daily full backup (production)
pg_dump -h production.db -U postgres -d freight_db \
  | gzip > backup_$(date +%Y%m%d).sql.gz

# Store in S3
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://backups/postgres/

# Retention: 30 days
```

### Recovery Procedure

```bash
# Restore from backup
gunzip backup_20240101.sql.gz
psql -h localhost -U postgres -d freight_db < backup_20240101.sql

# Or via AWS S3
aws s3 cp s3://backups/postgres/backup_20240101.sql.gz .
gunzip backup_20240101.sql.gz
psql -h localhost -U postgres -d freight_db < backup_20240101.sql
```

### Point-in-Time Recovery (PITR)

```sql
-- Enable WAL archiving
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'

-- Recover to specific timestamp
SELECT pg_wal_replay_resume();
-- Shutdown and copy data from point-in-time backup
```

---

## 8. Troubleshooting

### Issue: Slow Shipment List Queries

**Investigation**:
```sql
EXPLAIN ANALYZE
SELECT * FROM shipments 
WHERE user_id = '123' 
AND status = 'pending'
LIMIT 50;
```

**Solution**: Verify index exists
```sql
SELECT * FROM pg_indexes 
WHERE tablename = 'shipments' 
AND indexname = 'idx_shipment_user_status';

-- If missing, create it:
CREATE INDEX idx_shipment_user_status ON shipments(user_id, status);
```

### Issue: "Too Many Connections" Error

**Investigation**:
```sql
SELECT datname, usename, state, count(*)
FROM pg_stat_activity
GROUP BY datname, usename, state;
```

**Solution**:
1. Increase connection pool: `connection_limit=30` in DATABASE_URL
2. Kill idle connections (see above)
3. Upgrade to larger PostgreSQL plan

### Issue: High Memory Usage

**Investigation**:
```sql
-- Check shared_buffers configuration
SHOW shared_buffers;

-- Check actual memory usage
SELECT * FROM pg_stat_progress_basebackup;
```

**Solution**:
1. Increase RAM on server
2. Adjust shared_buffers up (PostgreSQL will use more cache)
3. Implement query result caching

### Issue: Disk Space Running Out

**Investigation**:
```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Solution**:
1. Archive old data: `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days'`
2. Truncate tables: `TRUNCATE audit_logs;`
3. Add storage to PostgreSQL volume
4. Implement table partitioning by date

---

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Query Time (p95) | <50ms | >500ms |
| Cache Hit Ratio | >99% | <95% |
| Disk I/O Wait | <10% | >30% |
| Connection Pool | <80% | >95% |
| Backup Duration | <15min | >1hour |
| Recovery Time (RTO) | <1hour | N/A |
| Data Loss (RPO) | <1min | N/A |

## Contacts & References

- PostgreSQL Docs: https://www.postgresql.org/docs/
- Prisma Performance: https://www.prisma.io/docs/guide/performance-and-optimization
- Query Optimization: https://wiki.postgresql.org/wiki/Performance_Optimization
- Index Design: https://use-the-index-luke.com/
