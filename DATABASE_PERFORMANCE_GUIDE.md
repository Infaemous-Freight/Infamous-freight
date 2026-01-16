# Database Performance Tuning & Optimization

## 1. Query Optimization with Prisma

### Problem: N+1 Queries

**❌ BAD - Creates N+1 queries**

```javascript
// Fetches shipments
const shipments = await prisma.shipment.findMany();

// Then N additional queries for each driver
for (const shipment of shipments) {
  shipment.driver = await prisma.driver.findUnique({
    where: { id: shipment.driverId },
  });
}
```

**✅ GOOD - Single query with include**

```javascript
const shipments = await prisma.shipment.findMany({
  include: {
    driver: true,
    customer: true,
    waypoints: true,
  },
});
```

### Select Only Needed Fields

**❌ BAD - Returns all columns**

```javascript
const shipment = await prisma.shipment.findUnique({
  where: { id: '123' },
});
```

**✅ GOOD - Select specific fields**

```javascript
const shipment = await prisma.shipment.findUnique({
  where: { id: '123' },
  select: {
    id: true,
    status: true,
    origin: true,
    destination: true,
    // Exclude large JSON fields, binary data
  },
});
```

### Pagination for Large Datasets

**✅ GOOD - Paginate results**

```javascript
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 50, 100);

const shipments = await prisma.shipment.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});

const total = await prisma.shipment.count();

res.json({
  data: shipments,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  },
});
```

### Efficient Filtering

**✅ GOOD - Filter at database level**

```javascript
// Build where clause dynamically
const where = {};

if (req.query.status) where.status = req.query.status;
if (req.query.driverId) where.driverId = req.query.driverId;
if (req.query.minWeight) where.weight = { gte: req.query.minWeight };

const shipments = await prisma.shipment.findMany({
  where,
  include: { driver: true },
  take: 50,
});
```

## 2. Database Indexes

### Creating Indexes

**File: `api/prisma/schema.prisma`**

```prisma
model Shipment {
  id        String   @id @default(cuid())
  status    String   // Frequently filtered
  driverId  String   // Foreign key, frequently joined
  createdAt DateTime @default(now()) // Date range queries
  updatedAt DateTime @updatedAt

  // Indexes for common queries
  @@index([status])
  @@index([driverId])
  @@index([createdAt])
  @@index([status, createdAt]) // Composite index
}

model User {
  id    String @id @default(cuid())
  email String @unique // Unique constraint creates index
  role  String
  createdAt DateTime @default(now())

  @@index([role])
}

model Driver {
  id        String @id @default(cuid())
  email     String @unique
  status    String // "active", "inactive"
  rating    Float
  createdAt DateTime @default(now())

  @@index([status])
  @@index([rating]) // For sorting high-rated drivers
}
```

### Generating Index Migrations

```bash
cd api

# Update schema
pnpm prisma:migrate:dev --name add_indexes

# Apply to production
pnpm prisma:migrate:deploy
```

### View Existing Indexes

```sql
-- PostgreSQL
SELECT * FROM pg_indexes WHERE tablename = 'Shipment';

-- Show index performance
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## 3. Query Performance Monitoring

### Enable Slow Query Logging

**File: `api/src/services/queryLogger.js`**

```javascript
const winston = require('winston');

const slowQueryLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.json(),
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.File({ filename: 'slow-queries.log' }),
  ],
});

class QueryLogger {
  logQuery(query, duration, params = []) {
    if (duration > 100) {
      // Log queries slower than 100ms
      slowQueryLogger.warn('Slow query detected', {
        query,
        duration,
        params,
        timestamp: new Date(),
      });
    }
  }
}

module.exports = new QueryLogger();
```

### Prisma Query Extension

**File: `api/src/config/prismaExtended.js`**

```javascript
const { PrismaClient } = require('@prisma/client');
const queryLogger = require('../services/queryLogger');

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  const duration = after - before;

  if (duration > 100) {
    queryLogger.logQuery(params.action, duration, params.args);

    console.warn(`${params.model}.${params.action} took ${duration}ms`, {
      args: params.args,
    });
  }

  return result;
});

module.exports = prisma;
```

### Usage

```javascript
const prisma = require('../config/prismaExtended');

// Any query will now log if it exceeds 100ms
const shipments = await prisma.shipment.findMany({
  include: { driver: true },
});
```

## 4. Read Replicas

### Setup PostgreSQL Replication

**Primary Server (write operations)**

```bash
# In .env
DATABASE_URL="postgresql://user:password@primary-host:5432/db"
```

**Replica Server (read operations)**

```bash
# In .env
DATABASE_READ_REPLICAS="postgresql://user:password@replica1:5432/db,postgresql://user:password@replica2:5432/db"
```

### Connection Pool Management

**File: `api/src/config/prismaPool.js`**

```javascript
const { PrismaClient } = require('@prisma/client');

// Primary connection for writes
const primaryPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Read replica connection pool
const readReplicas = (process.env.DATABASE_READ_REPLICAS || '').split(',');
let replicaIndex = 0;

function getReadPrisma() {
  if (readReplicas.length === 0) {
    return primaryPrisma;
  }

  // Round-robin load balancing
  const replica = readReplicas[replicaIndex % readReplicas.length];
  replicaIndex++;

  return new PrismaClient({
    datasources: {
      db: {
        url: replica,
      },
    },
  });
}

module.exports = { primaryPrisma, getReadPrisma };
```

### Usage Pattern

```javascript
const { primaryPrisma, getReadPrisma } = require('../config/prismaPool');

// Write operations use primary
await primaryPrisma.shipment.create({
  data: { origin: 'NYC', destination: 'LA' },
});

// Read operations use replicas
const shipments = await getReadPrisma().shipment.findMany();
```

## 5. Materialized Views for Reporting

### Creating Views

**File: `api/prisma/migrations/[timestamp]_create_shipment_stats/migration.sql`**

```sql
-- Create materialized view for shipment statistics
CREATE MATERIALIZED VIEW shipment_stats AS
SELECT
  DATE_TRUNC('day', s.createdAt) as day,
  s.status,
  COUNT(*) as count,
  AVG(s.weight) as avg_weight,
  SUM(CASE WHEN s.status = 'delivered' THEN 1 ELSE 0 END) as delivered_count
FROM "Shipment" s
GROUP BY DATE_TRUNC('day', s.createdAt), s.status;

-- Create index on materialized view
CREATE INDEX idx_shipment_stats_day ON shipment_stats(day);

-- Create refresh function
CREATE FUNCTION refresh_shipment_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY shipment_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every hour
SELECT cron.schedule('refresh-shipment-stats', '0 * * * *', 'SELECT refresh_shipment_stats()');
```

### Query View

```javascript
const stats = await prisma.$queryRaw`
  SELECT day, status, count, avg_weight
  FROM shipment_stats
  WHERE day > NOW() - INTERVAL '30 days'
  ORDER BY day DESC
`;
```

## 6. Connection Pooling

### PgBouncer Configuration

**File: `/etc/pgbouncer/pgbouncer.ini`**

```ini
[databases]
db = host=localhost port=5432 user=app_user password=app_password

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 100
max_user_connections = 100

# Connection lifetime
server_lifetime = 3600
server_idle_timeout = 600

# Query timeout
query_timeout = 30000

# Logging
logfile = /var/log/pgbouncer/pgbouncer.log
pidfile = /var/run/pgbouncer/pgbouncer.pid
```

### Prisma with PgBouncer

```env
# In .env - Point to PgBouncer, not PostgreSQL directly
DATABASE_URL="postgresql://user:password@localhost:6432/db?schema=public"
```

## 7. Batch Operations

### Batch Inserts

**❌ BAD - Individual inserts**

```javascript
for (const item of items) {
  await prisma.shipment.create({ data: item });
}
// 1000 items = 1000 queries
```

**✅ GOOD - Batch insert**

```javascript
await prisma.shipment.createMany({
  data: items,
  skipDuplicates: true, // Skip unique constraint violations
});
// 1000 items = 1 query
```

### Batch Updates

**✅ GOOD - Update many at once**

```javascript
await prisma.shipment.updateMany({
  where: { status: 'pending' },
  data: { status: 'confirmed' },
});
```

## 8. Query Analysis

### EXPLAIN ANALYZE

```javascript
const plan = await prisma.$queryRaw`
  EXPLAIN ANALYZE
  SELECT s.id, s.status, d.name
  FROM "Shipment" s
  LEFT JOIN "Driver" d ON s.driverId = d.id
  WHERE s.status = 'in_transit'
  LIMIT 100
`;

console.log(plan);
```

### Common Slow Patterns

1. **Sequential Scans** - Add indexes to filtered columns
2. **Nested Loop Joins** - Use indexes on foreign keys
3. **Hash Aggregates** - Ensure GROUP BY columns are indexed

## 9. Caching Strategy

### Query Result Caching

**File: `api/src/middleware/cacheQueries.js`**

```javascript
const redis = require('redis');
const client = redis.createClient();

async function cacheQuery(key, fetcher, ttl = 3600) {
  // Try cache first
  const cached = await client.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const result = await fetcher();

  // Store in cache
  await client.setex(key, ttl, JSON.stringify(result));

  return result;
}

module.exports = { cacheQuery };
```

### Usage

```javascript
const { cacheQuery } = require('../middleware/cacheQueries');

router.get('/dashboard/stats', authenticate, async (req, res, next) => {
  try {
    const stats = await cacheQuery('dashboard:stats', async () => {
      return prisma.shipment.groupBy({
        by: ['status'],
        _count: true,
      });
    }, 3600); // Cache for 1 hour

    res.json(stats);
  } catch (err) {
    next(err);
  }
});
```

## 10. Performance Monitoring Dashboard

### Metrics Endpoint

**File: `api/src/routes/admin.metrics.js`**

```javascript
const router = express.Router();

router.get('/admin/database/metrics', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const metrics = {
      // Connection pool stats
      activeConnections: await prisma.$queryRaw`
        SELECT count(*) FROM pg_stat_activity
      `,

      // Slow queries
      slowQueries: await prisma.$queryRaw`
        SELECT query, calls, mean_time, max_time
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      `,

      // Index usage
      indexStats: await prisma.$queryRaw`
        SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `,

      // Table sizes
      tableSizes: await prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `,
    };

    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

## Testing

**File: `api/src/routes/__tests__/performance.test.js`**

```javascript
describe('Database Performance', () => {
  it('should fetch shipments without N+1', async () => {
    // Reset query count
    let queryCount = 0;

    prisma.$use(async (params, next) => {
      queryCount++;
      return next(params);
    });

    await prisma.shipment.findMany({
      include: { driver: true },
      take: 100,
    });

    // Should be ~2 queries (shipments + drivers), not 101
    expect(queryCount).toBeLessThan(5);
  });

  it('should paginate large results', async () => {
    const page = 1;
    const limit = 50;

    const response = await request(app)
      .get('/api/shipments')
      .query({ page, limit });

    expect(response.body.pagination.limit).toBe(50);
    expect(response.body.pagination.page).toBe(1);
  });

  it('should use indexes effectively', async () => {
    const before = Date.now();

    await prisma.shipment.findMany({
      where: { status: 'pending' },
      take: 100,
    });

    const duration = Date.now() - before;

    // Indexed query should be fast (<100ms)
    expect(duration).toBeLessThan(100);
  });
});
```

## Best Practices Checklist

- ✅ Use `include` instead of multiple queries
- ✅ Use `select` to fetch only needed fields
- ✅ Implement pagination for list endpoints
- ✅ Add indexes to frequently filtered columns
- ✅ Monitor slow queries in production
- ✅ Use read replicas for heavy read loads
- ✅ Batch insert/update operations
- ✅ Cache frequently accessed data
- ✅ Analyze query plans with EXPLAIN
- ✅ Set connection pool limits

