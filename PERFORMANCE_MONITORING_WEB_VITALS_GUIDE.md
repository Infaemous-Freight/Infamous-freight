# Performance Monitoring & Web Vitals Guide

## 1. Core Web Vitals Monitoring

### Installation (Frontend)

```bash
cd web
pnpm add web-vitals @vercel/analytics @vercel/speed-insights
```

### Web Vitals Collection

**File: `web/lib/vitals.ts`**

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}

// Thresholds for ratings
const thresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 600, poor: 1200 },
};

function getRating(value: number, metricName: string): 'good' | 'needs-improvement' | 'poor' {
  const { good, poor } = thresholds[metricName as keyof typeof thresholds] || {
    good: 0,
    poor: Infinity,
  };

  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

export function initializeWebVitals() {
  // Largest Contentful Paint (LCP) - when main content loads
  getLCP((metric) => {
    const vital: WebVital = {
      name: 'LCP',
      value: Math.round(metric.value),
      rating: getRating(metric.value, 'LCP'),
      delta: Math.round(metric.delta),
      id: metric.id,
      navigationType: metric.navigationType,
    };
    trackWebVital(vital);
  });

  // First Input Delay (FID) - responsiveness to user input
  getFID((metric) => {
    const vital: WebVital = {
      name: 'FID',
      value: Math.round(metric.value),
      rating: getRating(metric.value, 'FID'),
      delta: Math.round(metric.delta),
      id: metric.id,
    };
    trackWebVital(vital);
  });

  // Cumulative Layout Shift (CLS) - visual stability
  getCLS((metric) => {
    const vital: WebVital = {
      name: 'CLS',
      value: parseFloat(metric.value.toFixed(3)),
      rating: getRating(metric.value, 'CLS'),
      delta: parseFloat(metric.delta.toFixed(3)),
      id: metric.id,
    };
    trackWebVital(vital);
  });

  // First Contentful Paint (FCP) - when first content appears
  getFCP((metric) => {
    const vital: WebVital = {
      name: 'FCP',
      value: Math.round(metric.value),
      rating: getRating(metric.value, 'FCP'),
      delta: Math.round(metric.delta),
      id: metric.id,
    };
    trackWebVital(vital);
  });

  // Time to First Byte (TTFB) - server response time
  getTTFB((metric) => {
    const vital: WebVital = {
      name: 'TTFB',
      value: Math.round(metric.value),
      rating: getRating(metric.value, 'TTFB'),
      delta: Math.round(metric.delta),
      id: metric.id,
    };
    trackWebVital(vital);
  });
}

function trackWebVital(vital: WebVital) {
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', vital.name, {
      value: vital.value,
      event_category: 'Web Vitals',
      event_label: vital.id,
      non_interaction: true,
    });
  }

  // Send to custom API
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: vital.name,
      value: vital.value,
      rating: vital.rating,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
  }).catch(() => {
    // Silently fail, don't block user
  });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 ${vital.name}: ${vital.value}ms (${vital.rating})`);
  }
}
```

### Integrate Web Vitals in App

**File: `web/pages/_app.tsx`**

```typescript
import { useEffect } from 'react';
import { initializeWebVitals } from '../lib/vitals';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Initialize Web Vitals tracking
    initializeWebVitals();

    // Vercel Analytics (production)
    if (process.env.NEXT_PUBLIC_ENV === 'production') {
      import('@vercel/analytics/react').then(({ Analytics }) => {
        return <Analytics />;
      });
    }

    // Vercel Speed Insights
    if (process.env.NEXT_PUBLIC_ENABLE_SPEED_INSIGHTS === 'true') {
      import('@vercel/speed-insights/next').then(({ SpeedInsights }) => {
        return <SpeedInsights />;
      });
    }
  }, []);

  return <Component {...pageProps} />;
}
```

## 2. Backend Performance Monitoring

### Request Duration Tracking

**File: `api/src/middleware/performanceMonitoring.js`**

```javascript
const { performanceObserver, performance } = require('perf_hooks');
const { httpRequestDuration } = require('../config/metrics');

function performanceMonitoringMiddleware(req, res, next) {
  const startTime = performance.now();
  const startMark = `start-${req.id}`;
  const endMark = `end-${req.id}`;

  performance.mark(startMark);

  res.on('finish', () => {
    performance.mark(endMark);
    performance.measure(`${req.method} ${req.path}`, startMark, endMark);

    const duration = performance.now() - startTime;

    // Log slow requests
    if (duration > 1000) {
      console.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: Math.round(duration),
        status: res.statusCode,
      });
    }

    // Record metric
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration / 1000);
  });

  next();
}

module.exports = { performanceMonitoringMiddleware };
```

### Memory & CPU Monitoring

**File: `api/src/services/systemMetrics.js`**

```javascript
const os = require('os');
const { performance } = require('perf_hooks');

class SystemMetrics {
  constructor() {
    this.memoryUsage = [];
    this.cpuUsage = [];
    this.startTime = process.hrtime.bigint();
  }

  // Get memory usage
  getMemoryUsage() {
    const mem = process.memoryUsage();

    return {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      external: Math.round(mem.external / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024), // Resident Set Size
      heapUsagePercent: ((mem.heapUsed / mem.heapTotal) * 100).toFixed(2),
    };
  }

  // Get CPU usage
  getCPUUsage() {
    const cpuUsage = process.cpuUsage();

    return {
      user: Math.round(cpuUsage.user / 1000), // Convert to ms
      system: Math.round(cpuUsage.system / 1000),
      total: Math.round((cpuUsage.user + cpuUsage.system) / 1000),
    };
  }

  // Get system stats
  getSystemStats() {
    const uptime = process.uptime();
    const cpuCount = os.cpus().length;

    return {
      nodeUptime: Math.round(uptime),
      systemLoadAverage: os.loadavg(),
      totalMemory: Math.round(os.totalmem() / 1024 / 1024),
      freeMemory: Math.round(os.freemem() / 1024 / 1024),
      cpuCount,
    };
  }

  // Get detailed metrics
  getDetailedMetrics() {
    return {
      memory: this.getMemoryUsage(),
      cpu: this.getCPUUsage(),
      system: this.getSystemStats(),
      timestamp: new Date().toISOString(),
    };
  }

  // Track metric history
  recordMetrics() {
    this.memoryUsage.push({
      timestamp: Date.now(),
      ...this.getMemoryUsage(),
    });

    this.cpuUsage.push({
      timestamp: Date.now(),
      ...this.getCPUUsage(),
    });

    // Keep only last 1 hour of data
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.memoryUsage = this.memoryUsage.filter(
      (m) => m.timestamp > oneHourAgo
    );
    this.cpuUsage = this.cpuUsage.filter((c) => c.timestamp > oneHourAgo);
  }

  // Get metrics trend
  getMetricsTrend() {
    const getMean = (arr, key) =>
      arr.length > 0 ? arr.reduce((sum, m) => sum + m[key], 0) / arr.length : 0;

    return {
      memory: {
        avgHeapUsed: Math.round(getMean(this.memoryUsage, 'heapUsed')),
        maxHeapUsed: Math.max(...this.memoryUsage.map((m) => m.heapUsed)),
        avgHeapUsagePercent: getMean(
          this.memoryUsage,
          'heapUsagePercent'
        ).toFixed(2),
      },
      cpu: {
        avgCPU: Math.round(getMean(this.cpuUsage, 'total')),
        maxCPU: Math.max(...this.cpuUsage.map((c) => c.total)),
      },
    };
  }
}

module.exports = new SystemMetrics();
```

### System Metrics Endpoint

**File: `api/src/routes/admin.performance.js`**

```javascript
const express = require('express');
const router = express.Router();
const systemMetrics = require('../services/systemMetrics');
const { authenticate, requireRole } = require('../middleware/security');

// Get current system metrics
router.get(
  '/admin/performance/metrics',
  authenticate,
  requireRole('admin'),
  (req, res) => {
    const metrics = systemMetrics.getDetailedMetrics();
    res.json(metrics);
  }
);

// Get metrics trend
router.get(
  '/admin/performance/trend',
  authenticate,
  requireRole('admin'),
  (req, res) => {
    const trend = systemMetrics.getMetricsTrend();
    res.json(trend);
  }
);

// Get memory history
router.get(
  '/admin/performance/memory-history',
  authenticate,
  requireRole('admin'),
  (req, res) => {
    res.json(systemMetrics.memoryUsage);
  }
);

// Get CPU history
router.get(
  '/admin/performance/cpu-history',
  authenticate,
  requireRole('admin'),
  (req, res) => {
    res.json(systemMetrics.cpuUsage);
  }
);

module.exports = router;
```

## 3. Database Query Performance

### Query Profiling

**File: `api/src/services/queryProfiler.js`**

```javascript
class QueryProfiler {
  constructor() {
    this.queries = [];
  }

  // Profile query
  async profileQuery(name, fn) {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      this.queries.push({
        name,
        duration,
        status: 'success',
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.queries.push({
        name,
        duration,
        status: 'error',
        error: error.message,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  // Get slow queries
  getSlowQueries(threshold = 100) {
    return this.queries
      .filter((q) => q.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20);
  }

  // Get query stats
  getQueryStats() {
    if (this.queries.length === 0) return null;

    const stats = {};

    for (const query of this.queries) {
      if (!stats[query.name]) {
        stats[query.name] = {
          count: 0,
          totalDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
        };
      }

      const stat = stats[query.name];
      stat.count++;
      stat.totalDuration += query.duration;
      stat.minDuration = Math.min(stat.minDuration, query.duration);
      stat.maxDuration = Math.max(stat.maxDuration, query.duration);
      stat.avgDuration = stat.totalDuration / stat.count;
    }

    return Object.entries(stats).map(([name, stat]) => ({
      name,
      ...stat,
    }));
  }

  // Clear history
  clear() {
    this.queries = [];
  }
}

module.exports = new QueryProfiler();
```

## 4. Analytics Dashboard

### Web Vitals Endpoint

**File: `api/src/routes/analytics.vitals.js`**

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/security');

router.post('/analytics/web-vitals', async (req, res) => {
  try {
    const { metric, value, rating, url, userAgent } = req.body;

    // Store vitals
    await prisma.webVital.create({
      data: {
        metric,
        value,
        rating,
        url,
        userAgent,
        timestamp: new Date(),
        userId: req.user?.sub,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to store web vital', err);
    res.status(500).json({ error: 'Failed to store metric' });
  }
});

// Get vitals summary
router.get(
  '/analytics/web-vitals/summary',
  authenticate,
  async (req, res, next) => {
    try {
      const { days = 7 } = req.query;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const summary = await prisma.webVital.groupBy({
        by: ['metric'],
        where: {
          timestamp: { gte: startDate },
        },
        _avg: {
          value: true,
        },
        _count: true,
      });

      res.json(summary);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
```

## 5. Performance Budgets

### Budget Configuration

**File: `api/config/performanceBudget.js`**

```javascript
const budgets = {
  // Frontend budgets (ms)
  webVitals: {
    LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
    FID: { good: 100, poor: 300 }, // First Input Delay
    CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
    FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
    TTFB: { good: 600, poor: 1200 }, // Time to First Byte
  },

  // API budgets (ms)
  api: {
    p50: 50, // 50th percentile
    p95: 200, // 95th percentile
    p99: 500, // 99th percentile
  },

  // Database budgets (ms)
  database: {
    simpleQuery: 10, // Simple select
    complexQuery: 100, // Joins, aggregations
    mutation: 50, // Insert, update, delete
  },

  // Bundle size budgets (KB)
  bundle: {
    main: 150,
    vendor: 200,
    total: 300,
  },

  // Memory budgets (MB)
  memory: {
    heapUsed: 300,
    heapTotal: 500,
  },
};

module.exports = budgets;
```

## 6. Performance Testing

**File: `api/src/routes/__tests__/performance.test.js`**

```javascript
describe('Performance Budgets', () => {
  describe('Web Vitals', () => {
    it('should maintain LCP < 2.5s', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      const lcp = response.headers['x-lcp'];
      expect(parseInt(lcp)).toBeLessThan(2500);
    });

    it('should maintain TTFB < 600ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/')
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(600);
    });
  });

  describe('API Performance', () => {
    it('should return list endpoint within budget', async () => {
      const startTime = performance.now();

      await request(app)
        .get('/api/shipments?limit=100')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const duration = performance.now() - startTime;

      // P95 budget: 200ms
      expect(duration).toBeLessThan(200);
    });

    it('should handle database queries within budget', async () => {
      const queryProfiler = require('../services/queryProfiler');
      queryProfiler.clear();

      await prisma.shipment.findMany({
        where: { status: 'pending' },
        take: 100,
      });

      const slowQueries = queryProfiler.getSlowQueries(100);
      expect(slowQueries.length).toBe(0);
    });
  });

  describe('Memory Usage', () => {
    it('should not exceed memory budget', () => {
      const systemMetrics = require('../services/systemMetrics');
      const metrics = systemMetrics.getMemoryUsage();

      // Heap used < 300MB
      expect(metrics.heapUsed).toBeLessThan(300);
    });
  });
});
```

## Best Practices

1. **Monitor continuously** - Track metrics in production
2. **Set realistic budgets** - Based on user expectations
3. **Alert on violations** - Notify team of regressions
4. **Optimize bottlenecks** - Focus on highest-impact areas
5. **Test on slow devices** - Don't just test on high-end hardware
6. **Track user experience** - Collect RUM data
7. **Analyze trends** - Understand performance patterns over time

