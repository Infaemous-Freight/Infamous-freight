/*
 * Monitoring & Metrics Service
 * Tracks performance, errors, and business metrics
 */

const prometheus = require('prom-client');

// Default metrics (memory, CPU, etc)
prometheus.collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const dbQueryDuration = new prometheus.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

const apiErrors = new prometheus.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['error_type', 'status_code', 'route'],
});

const rateLimitHits = new prometheus.Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['limiter_type', 'user_id'],
});

const shipmentEvents = new prometheus.Counter({
  name: 'shipment_events_total',
  help: 'Total shipment state changes',
  labelNames: ['event_type', 'status'],
});

const paymentEvents = new prometheus.Counter({
  name: 'payment_events_total',
  help: 'Total payment events',
  labelNames: ['event_type', 'status'],
});

const authEvents = new prometheus.Counter({
  name: 'auth_events_total',
  help: 'Total authentication events',
  labelNames: ['event_type', 'provider'],
});

const cacheMetrics = new prometheus.Gauge({
  name: 'cache_size_bytes',
  help: 'Current cache size in bytes',
  labelNames: ['cache_type'],
});

const activeConnections = new prometheus.Gauge({
  name: 'active_db_connections',
  help: 'Current number of active database connections',
});

// Track HTTP request metrics
function trackHttpRequest(req, res) {
  const start = Date.now();
  const route = req.route?.path || req.path;

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);

    // Track errors
    if (res.statusCode >= 400) {
      apiErrors.inc({
        error_type: `http_${res.statusCode}`,
        status_code: res.statusCode,
        route,
      });
    }
  });
}

// Track database query metrics
function trackDbQuery(operation, model, duration) {
  const durationSeconds = duration / 1000;
  dbQueryDuration.labels(operation, model).observe(durationSeconds);
}

// Track rate limit events
function trackRateLimit(limiterType, userId) {
  rateLimitHits.inc({
    limiter_type: limiterType,
    user_id: userId || 'anonymous',
  });
}

// Track shipment status changes
function trackShipmentEvent(eventType, status) {
  shipmentEvents.inc({
    event_type: eventType,
    status: status || 'unknown',
  });
}

// Track payment events
function trackPaymentEvent(eventType, status) {
  paymentEvents.inc({
    event_type: eventType,
    status: status || 'unknown',
  });
}

// Track authentication events
function trackAuthEvent(eventType, provider = 'jwt') {
  authEvents.inc({
    event_type: eventType,
    provider,
  });
}

// Update cache size
function updateCacheSize(type, size) {
  cacheMetrics.set({ cache_type: type }, size);
}

// Update active connections
function setActiveConnections(count) {
  activeConnections.set(count);
}

// Get all metrics
function getMetrics() {
  return prometheus.register.metrics();
}

// Health check with metrics
async function healthCheck(prisma) {
  try {
    // Database health
    await prisma.$queryRaw`SELECT 1`;

    // Get connection pool stats
    const poolStats = {
      _connected: prisma.$metrics?.db?.connection?.active || 0,
      _queued: prisma.$metrics?.db?.connection?.idle || 0,
    };

    setActiveConnections(poolStats._connected);

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      connections: poolStats,
      uptime: process.uptime(),
    };
  } catch (err) {
    return {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message,
      uptime: process.uptime(),
    };
  }
}

// Middleware for automatic HTTP tracking
function metricsMiddleware(req, res, next) {
  trackHttpRequest(req, res);
  next();
}

module.exports = {
  // Metrics objects
  httpRequestDuration,
  dbQueryDuration,
  apiErrors,
  rateLimitHits,
  shipmentEvents,
  paymentEvents,
  authEvents,
  cacheMetrics,
  activeConnections,

  // Tracking functions
  trackHttpRequest,
  trackDbQuery,
  trackRateLimit,
  trackShipmentEvent,
  trackPaymentEvent,
  trackAuthEvent,
  updateCacheSize,
  setActiveConnections,

  // Utilities
  getMetrics,
  healthCheck,
  metricsMiddleware,
};
