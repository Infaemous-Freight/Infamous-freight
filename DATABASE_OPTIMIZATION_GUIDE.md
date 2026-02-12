# Database Optimization Guide

## Overview

This guide covers database optimization strategies for Infamous Freight Enterprises, focusing on PostgreSQL performance tuning with Prisma ORM.

## 1. Query Performance Analysis

### Enable Query Logging

Add to your `.env`:

```bash
# Log slow queries (> 1000ms)
DATABASE_LOG_SLOW_QUERIES=true
DATABASE_LOG_THRESHOLD_MS=1000
```

### Identify Slow Queries

```sql
-- Find slow queries in PostgreSQL
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- milliseconds
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Common N+1 Problems

❌ **BAD**: N+1 query pattern

```typescript
// This performs 1 + N queries (expensive!)
const shipments = await prisma.shipment.findMany();
for (const shipment of shipments) {
  shipment.driver = await prisma.driver.findUnique({
    where: { id: shipment.driverId },
  });
}
```

✅ **GOOD**: Use `include` to fetch related data in single query

```typescript
// Single query with join
const shipments = await prisma.shipment.findMany({
  include: {
    driver: true,
    route: true,
    shipmentItems: {
      include: {
        product: true,
      },
    },
  },
});
```

## 2. Index Strategy

### Create Indexes for Frequently Queried Fields

```prisma
// prisma/schema.prisma
model Shipment {
  id            String   @id @default(cuid())
  status        String   @default("pending")
  driverId      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  driver        Driver?   @relation(fields: [driverId], references: [id])

  // Indexes for common queries
  @@index([driverId])
  @@index([status])
  @@index([createdAt])
}

model Driver {
  id        String   @id @default(cuid())
  email     String   @unique
  status    String
  createdAt DateTime @default(now())

  shipments Shipment[]

  @@index([status])
  @@index([createdAt])
}
```

### Create Composite Indexes

```prisma
model Shipment {
  id       String @id @default(cuid())
  driverId String?
  status   String

  // Index for filtering by status and driver
  @@index([driverId, status])
}
```

### Check Existing Indexes

```sql
-- View all indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index size
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

## 3. Query Optimization Patterns

### Use Select to Reduce Data Transfer

```typescript
// Only fetch needed columns
const shipments = await prisma.shipment.findMany({
  select: {
    id: true,
    origin: true,
    destination: true,
    status: true,
    driver: {
      select: {
        id: true,
        name: true,
      },
    },
  },
  where: {
    status: "in_transit",
  },
  take: 100,
});
```

### Use Pagination for Large Results

```typescript
// Cursor-based pagination (more efficient for large datasets)
const page = 1;
const pageSize = 20;

const shipments = await prisma.shipment.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: "desc" },
  include: { driver: true },
});
```

### Batch Operations

```typescript
// ❌ BAD: Multiple individual updates
for (const id of shipmentIds) {
  await prisma.shipment.update({
    where: { id },
    data: { status: "delivered" },
  });
}

// ✅ GOOD: Batch update
await prisma.shipment.updateMany({
  where: { id: { in: shipmentIds } },
  data: { status: "delivered" },
});
```

## 4. Caching Strategy

### Cache Frequently Accessed Data

```typescript
const cache = new Map<string, { data: any; expiresAt: number }>();

async function getShipmentWithCache(id: string) {
  const cacheKey = `shipment:${id}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { driver: true },
  });

  // Cache for 5 minutes
  cache.set(cacheKey, {
    data: shipment,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return shipment;
}
```

### Redis Caching (Production)

```typescript
import redis from "redis";

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

async function getShipmentWithRedis(id: string) {
  const cacheKey = `shipment:${id}`;
  const cached = await client.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { driver: true },
  });

  // Cache for 5 minutes
  await client.setex(cacheKey, 300, JSON.stringify(shipment));

  return shipment;
}
```

## 5. Connection Pooling

### Configure Connection Pool

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/freight?schema=public"

# Connection pool settings (for production)
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_IDLE_TIMEOUT=30
```

### Prisma Client Configuration

```typescript
// prisma/client.ts
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
    ],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// Log slow queries in development
prisma.$on("query", (e) => {
  if (e.duration > 1000) {
    console.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});

export default prisma;
```

## 6. Migration Best Practices

### Zero-Downtime Migrations

```sql
-- Step 1: Add column as nullable
ALTER TABLE shipment ADD COLUMN new_column VARCHAR(255);

-- Step 2: Backfill existing rows
UPDATE shipment SET new_column = '';

-- Step 3: Make column not null
ALTER TABLE shipment ALTER COLUMN new_column SET NOT NULL;

-- Step 4: Create index
CREATE INDEX idx_shipment_new_column ON shipment(new_column);
```

### Prisma Migration Workflow

```bash
# Create a new migration
cd apps/api
pnpm prisma migrate dev --name add_new_field

# Review SQL before applying
pnpm prisma migrate resolve --rolled-back

# Apply all pending migrations to prod
pnpm prisma migrate deploy
```

## 7. Database Maintenance

### Analyze Query Plans

```sql
-- Explain query execution plan
EXPLAIN ANALYZE
SELECT s.id, s.status, d.name, d.phone
FROM shipment s
LEFT JOIN driver d ON s.driver_id = d.id
WHERE s.status = 'in_transit'
ORDER BY s.created_at DESC
LIMIT 100;
```

### Vacuum and Analyze

```sql
-- Clean up dead rows
VACUUM ANALYZE shipment;

-- Full vacuum (locks table, use during maintenance)
VACUUM FULL ANALYZE shipment;

-- Update table statistics
ANALYZE shipment;
```

### Check Index Health

```sql
-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Remove unused indexes
DROP INDEX CONCURRENTLY idx_unused_index;
```

## 8. Monitoring Queries

### Performance Metrics

```sql
-- Table size
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Row count
SELECT
  schemaname,
  tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Dead rows percentage
SELECT
  schemaname,
  tablename,
  n_live_tup,
  n_dead_tup,
  ROUND((n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) AS dead_percentage
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY dead_percentage DESC;
```

## 9. Common Bottlenecks

### 1. Missing Indexes

**Symptom**: Slow queries despite reasonable data volume

**Solution**:

```sql
-- Add indexes for frequently filtered columns
CREATE INDEX idx_shipment_driver_id ON shipment(driver_id);
CREATE INDEX idx_shipment_status ON shipment(status);
CREATE INDEX idx_shipment_created_at ON shipment(created_at DESC);
```

### 2. N+1 Queries

**Symptom**: Query count multiplies with data volume

**Solution**: Use Prisma's `include` or `select` with relations

### 3. Slow Joins

**Symptom**: Join queries timeout

**Solution**:

```sql
-- Create indexes on join keys
CREATE INDEX idx_shipment_driver_fk ON shipment(driver_id);
CREATE INDEX idx_driver_id ON driver(id);

-- Denormalize if necessary
ALTER TABLE shipment ADD COLUMN driver_name VARCHAR(255);
```

### 4. Large Result Sets

**Symptom**: High memory usage, slow response times

**Solution**: Implement pagination or streaming

```typescript
// Pagination
const LIMIT = 100;
let skip = 0;

while (true) {
  const batch = await prisma.shipment.findMany({
    skip,
    take: LIMIT,
  });

  if (batch.length === 0) break;

  // Process batch
  processBatch(batch);

  skip += LIMIT;
}
```

## 10. Performance Baselines

### Expected Metrics

| Query Type                      | Expected Duration | 95th Percentile |
| ------------------------------- | ----------------- | --------------- |
| Single row lookup (with index)  | <5ms              | <10ms           |
| List with pagination (100 rows) | <20ms             | <50ms           |
| Aggregation query               | <50ms             | <100ms          |
| Complex join (3+ tables)        | <100ms            | <200ms          |
| Export (10k rows)               | <1000ms           | <2000ms         |

### Monitoring Checklist

- [ ] Enable query logging in development
- [ ] Monitor slow query log in production
- [ ] Review index usage monthly
- [ ] Check table bloat quarterly
- [ ] Profile new queries before deployment
- [ ] Document expected duration for critical queries
- [ ] Set up alerts for query duration increase

## Quick Commands

```bash
# Generate Prisma client after schema changes
cd apps/api
pnpm prisma generate

# View database in GUI
pnpm prisma studio

# Create migration
pnpm prisma migrate dev --name <description>

# Apply migrations
pnpm prisma migrate deploy

# Show migration status
pnpm prisma migrate status

# Reset database (dev only!)
pnpm prisma migrate reset --force
```

---

**See Also**: [OPERATIONAL_RUNBOOKS.md](OPERATIONAL_RUNBOOKS.md#debugging-slow-queries) for troubleshooting procedures.
