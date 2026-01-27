/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Prometheus Metrics Endpoint
 */

let promClient;
try {
    promClient = require('prom-client');
} catch {
    // Fallback when prom-client not available
    console.warn('⚠ prom-client not installed. Install with: npm install prom-client');
    promClient = null;
}

// Fallback metrics storage
const fallbackMetrics = {
    requests: {},
    connections: 0,
    startTime: Date.now()
};

if (!promClient) {
    // Export fallback implementation
    module.exports = {
        metricsMiddleware: (req, res, next) => {
            const route = req.path || 'unknown';
            fallbackMetrics.requests[route] = (fallbackMetrics.requests[route] || 0) + 1;
            next();
        },
        metricsHandler: async (req, res) => {
            const metrics = [
                '# HELP http_requests_total Total HTTP requests',
                '# TYPE http_requests_total counter',
                ...Object.entries(fallbackMetrics.requests).map(([route, count]) =>
                    `http_requests_total{route="${route}"} ${count}`
                ),
                '',
                '# HELP api_uptime_seconds API uptime in seconds',
                '# TYPE api_uptime_seconds counter',
                `api_uptime_seconds ${Math.floor((Date.now() - fallbackMetrics.startTime) / 1000)}`,
                '',
                '# HELP active_connections Current active connections',
                '# TYPE active_connections gauge',
                `active_connections ${fallbackMetrics.connections}`,
                ''
            ];
            res.setHeader('Content-Type', 'text/plain; version=0.0.4');
            res.end(metrics.join('\n'));
        },
        trackDatabaseOperation: () => { },
        trackCache: () => { },
        metrics: {}
    };
}

// Create a Registry
const register = new promClient.Registry();

// Default metrics (CPU, memory, event loop, etc.)
promClient.collectDefaultMetrics({ register, prefix: 'api_' });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'status']
});

const activeConnections = new promClient.Gauge({
    name: 'active_connections',
    help: 'Number of active connections'
});

const databaseOperations = new promClient.Counter({
    name: 'database_operations_total',
    help: 'Total number of database operations',
    labelNames: ['operation', 'success']
});

const cacheHits = new promClient.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['hit']
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseOperations);
register.registerMetric(cacheHits);

// Middleware to track requests
function metricsMiddleware(req, res, next) {
    const start = Date.now();

    // Track active connections
    activeConnections.inc();

    // Override res.end to capture metrics
    const originalEnd = res.end;
    res.end = function (...args) {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path || 'unknown';
        const statusCode = res.statusCode;
        const status = statusCode < 400 ? '2xx' : statusCode < 500 ? '4xx' : '5xx';

        // Record metrics
        httpRequestDuration.observe({
            method: req.method,
            route,
            status_code: statusCode
        }, duration);

        httpRequestsTotal.inc({
            method: req.method,
            route,
            status_code: statusCode,
            status
        });

        activeConnections.dec();

        originalEnd.apply(res, args);
    };

    next();
}

// Metrics endpoint handler
async function metricsHandler(req, res) {
    try {
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
    } catch (err) {
        res.status(500).end(err.message);
    }
}

// Helper functions to track database operations
function trackDatabaseOperation(operation, success = true) {
    databaseOperations.inc({
        operation,
        success: success ? 'true' : 'false'
    });
}

// Helper function to track cache
function trackCache(hit = true) {
    cacheHits.inc({
        hit: hit ? 'true' : 'false'
    });
}

module.exports = {
    register,
    metricsMiddleware,
    metricsHandler,
    trackDatabaseOperation,
    trackCache,
    metrics: {
        httpRequestDuration,
        httpRequestsTotal,
        activeConnections,
        databaseOperations,
        cacheHits
    }
};
