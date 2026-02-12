# Performance Optimization Guide

**Last Updated**: December 30, 2025

---

## 1. Bundle Analysis & Optimization

### Analyze Bundle Sizes

```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Run analysis
cd apps/web && ANALYZE=true pnpm build
```

### Current Targets

- First Load JS: < 150KB
- Total bundle: < 500KB
- Code split per route
- Dynamic imports for heavy components

### Recommendations

#### 1.1 Implement Code Splitting

```typescript
// apps/web/pages/dashboard.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy analytics component
const AnalyticsChart = dynamic(
  () => import('../components/AnalyticsChart'),
  {
    loading: () => <Skeleton />,
    ssr: false,  // Render only on client
  }
);

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<Skeleton />}>
        <AnalyticsChart />
      </Suspense>
    </div>
  );
}
```

#### 1.2 Optimize Images

```typescript
// Use Next.js Image component with optimization
import Image from 'next/image';

export function ShipmentCard({ shipment }) {
  return (
    <Image
      src={shipment.image}
      alt={shipment.id}
      width={400}
      height={300}
      quality={75}           // Reduce quality by 25%
      placeholder="blur"     // Show blur while loading
      loading="lazy"         // Lazy load images
    />
  );
}
```

#### 1.3 Remove Unused Dependencies

```bash
# Identify unused packages
npm ls --depth=0

# Remove unused dependencies
npm prune

# Check bundle impact
npm install -g webbundlesize
webbundlesize  # Compare against baseline
```

---

## 2. Database Query Optimization

### N+1 Query Problem

**❌ BAD:**

```typescript
// Loads shipments + N queries for drivers
const shipments = await prisma.shipment.findMany();
for (const shipment of shipments) {
  shipment.driver = await prisma.driver.findUnique({
    where: { id: shipment.driverId },
  });
}
```

**✅ GOOD:**

```typescript
// Single query with JOIN
const shipments = await prisma.shipment.findMany({
  include: {
    driver: true,
    vehicle: true,
    customer: true,
  },
});
```

### Query Indexing

```prisma
// Optimize frequently queried fields
model Shipment {
  id              String    @id @default(cuid())
  customerId      String    @index          // Frequent filter
  driverId        String?   @index          // Frequent filter
  status          String    @index          // Frequent sort/filter
  organizationId  String    @index          // Multi-tenancy
  createdAt       DateTime  @default(now()) @index // Time-range queries
}

// Create composite indexes
model Shipment {
  @@index([organizationId, status])  // Common filter combo
  @@index([customerId, createdAt])   // Historical queries
}
```

### Query Performance Monitoring

```typescript
// Enable slow query logging
const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "stdout",
      level: "error",
    },
  ],
});

prisma.$on("query", (e) => {
  if (e.duration > 1000) {
    // Log queries > 1 second
    logger.warn("SLOW_QUERY", {
      query: e.query,
      duration: e.duration,
      params: e.params,
    });
  }
});
```

---

## 3. Caching Strategy

### Redis Caching Layer

```typescript
// Implement multi-level caching
export class CacheService {
  private cache = new Map(); // L1: In-memory
  private redis: RedisClient; // L2: Redis
  private ttl = {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 24 * 60 * 60, // 24 hours
  };

  async get(key: string) {
    // L1: Check in-memory
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // L2: Check Redis
    const redisValue = await this.redis.get(key);
    if (redisValue) {
      this.cache.set(key, redisValue); // Populate L1
      return redisValue;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number) {
    this.cache.set(key, value);
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string) {
    // Clear L1
    for (const key of this.cache.keys()) {
      if (key.match(pattern)) {
        this.cache.delete(key);
      }
    }

    // Clear L2
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### Cache-Busting Strategy

```typescript
// API endpoint modifications should invalidate cache
router.put("/shipments/:id", async (req, res) => {
  const shipment = await updateShipment(req.params.id, req.body);

  // Invalidate related caches
  await cacheService.invalidate(`shipment:${req.params.id}*`);
  await cacheService.invalidate(`shipments:*`); // List cache
  await cacheService.invalidate(`driver:${shipment.driverId}*`);

  res.json(shipment);
});
```

---

## 4. API Performance Optimization

### Response Compression

```typescript
import compression from "compression";

// Enable gzip compression
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Compression level (0-9)
  }),
);
```

### Pagination for Large Results

```typescript
// Implement cursor-based pagination
router.get("/shipments", async (req, res) => {
  const { limit = 20, cursor } = req.query;

  const shipments = await prisma.shipment.findMany({
    take: parseInt(limit) + 1, // Fetch one extra to check if more exist
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { createdAt: "desc" },
  });

  const hasMore = shipments.length > parseInt(limit);
  const results = shipments.slice(0, parseInt(limit));

  res.json({
    data: results,
    pagination: {
      hasMore,
      nextCursor: hasMore ? results[results.length - 1].id : null,
    },
  });
});
```

### Partial Responses (Field Selection)

```typescript
// Allow clients to request only needed fields
router.get("/shipments/:id", async (req, res) => {
  const fields = req.query.fields?.split(",") || [
    "id",
    "status",
    "customerId",
    "driverId",
  ];

  const shipment = await prisma.shipment.findUnique({
    where: { id: req.params.id },
    select: Object.fromEntries(fields.map((f) => [f, true])),
  });

  res.json(shipment);
});
```

---

## 5. Real-time Performance (WebSocket)

### Message Batching

```typescript
// Batch WebSocket updates to reduce overhead
class MessageBatcher {
  private batch = new Map();
  private batchSize = 100;
  private flushInterval = 100; // ms

  push(event: string, data: any) {
    if (!this.batch.has(event)) {
      this.batch.set(event, []);
    }

    this.batch.get(event).push(data);

    if (this.getTotalSize() >= this.batchSize) {
      this.flush();
    }
  }

  private flush() {
    for (const [event, messages] of this.batch) {
      io.emit(event, { batch: messages, timestamp: Date.now() });
    }
    this.batch.clear();
  }

  private getTotalSize() {
    let size = 0;
    for (const messages of this.batch.values()) {
      size += messages.length;
    }
    return size;
  }
}

// Use in server
const batcher = new MessageBatcher();
setInterval(() => batcher.flush(), 100);
```

### Compression for WebSocket

```typescript
// Compress large payloads
import pako from "pako";

socket.on("bulk_update", (data) => {
  if (data.compressed) {
    const decompressed = pako.inflate(Buffer.from(data.payload, "base64"), {
      to: "string",
    });
    const parsed = JSON.parse(decompressed);
    handleUpdate(parsed);
  } else {
    handleUpdate(data);
  }
});
```

---

## 6. Load Testing & Benchmarking

### K6 Load Test Configuration

```javascript
// scripts/load-test-performance.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 100 }, // Ramp up
    { duration: "1m30s", target: 100 }, // Stable
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.1"],
  },
};

export default function () {
  // Test shipment list endpoint
  let res = http.get("http://localhost:4000/api/shipments?limit=50");
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "has pagination": (r) => r.json().pagination !== undefined,
  });

  sleep(1);

  // Test single shipment fetch
  res = http.get("http://localhost:4000/api/shipments/1");
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 200ms": (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

### Run Load Tests

```bash
# Install K6
brew install k6  # macOS
# or apt-get install k6  # Linux

# Run load test
k6 run scripts/load-test-performance.js

# Generate HTML report
k6 run --out html=report.html scripts/load-test-performance.js
```

---

## 7. Monitoring & Metrics

### Key Performance Indicators (KPIs)

```typescript
// Monitor these metrics
export const kpis = {
  // API Performance
  p50_latency: "Median response time (target: < 100ms)",
  p95_latency: "P95 response time (target: < 500ms)",
  p99_latency: "P99 response time (target: < 1000ms)",
  error_rate: "Percentage of failed requests (target: < 1%)",

  // User Experience
  fcp: "First Contentful Paint (target: < 1.8s)",
  lcp: "Largest Contentful Paint (target: < 2.5s)",
  cls: "Cumulative Layout Shift (target: < 0.1)",
  ttfb: "Time to First Byte (target: < 600ms)",

  // Infrastructure
  cpu_usage: "CPU utilization (target: < 70%)",
  memory_usage: "Memory utilization (target: < 80%)",
  disk_io: "Disk I/O operations (monitor for spikes)",

  // Cache
  cache_hit_rate: "Cache hit ratio (target: > 70%)",
  cache_size: "Redis memory usage (monitor for growth)",
};
```

### Performance Dashboard Queries

```typescript
// Prometheus queries for Grafana dashboard
const queries = {
  // API latency
  p95_latency:
    "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",

  // Error rate
  error_rate: 'rate(http_requests_total{status=~"5.."}[1m])',

  // Cache hit rate
  cache_hits: "rate(cache_hits_total[1m])",
  cache_misses: "rate(cache_misses_total[1m])",

  // Memory usage
  memory_usage: "process_resident_memory_bytes / 1024 / 1024",
};
```

---

## 8. Quick Wins (Implement First)

### ✅ Easy Optimizations

1. **Enable Gzip Compression** (5 min)

   ```bash
   # Already configured with compression middleware
   # Verify in responses: "Content-Encoding: gzip"
   ```

2. **Add Cache Headers** (5 min)

   ```typescript
   app.use((req, res, next) => {
     res.set("Cache-Control", "public, max-age=3600");
     next();
   });
   ```

3. **Enable HTTP/2** (10 min)

   ```typescript
   // Use spdy or native http2 module
   import spdy from "spdy";
   spdy.createServer(app);
   ```

4. **Database Indexes** (10 min)

   ```bash
   cd apps/api && pnpm prisma migrate dev --name add_performance_indexes
   ```

5. **Monitor Slow Queries** (5 min)

   ```bash
   # Enable query logging in Prisma
   # Review slow queries daily
   ```

---

## 9. Expected Performance Improvements

After implementing these optimizations:

| Metric          | Before | After | Target  |
| --------------- | ------ | ----- | ------- |
| First Load JS   | 250KB  | 120KB | < 150KB |
| API P95 Latency | 800ms  | 350ms | < 500ms |
| Cache Hit Rate  | 45%    | 80%   | > 70%   |
| Error Rate      | 2%     | 0.5%  | < 1%    |
| PageLoad Time   | 4.2s   | 1.8s  | < 2.5s  |

---

## 10. Ongoing Monitoring

```bash
# Daily
- Check error rate in logs
- Monitor cache hit rate
- Review slow queries

# Weekly
- Run lighthouse audit
- Check bundle size trend
- Review API latency metrics

# Monthly
- Run full load test
- Analyze user performance data
- Plan optimization sprints
```

---

**Next Steps**:

1. ✅ Run bundle analyzer
2. Implement database indexes
3. Add Redis caching layer
4. Set up performance monitoring dashboard
5. Schedule quarterly performance reviews
