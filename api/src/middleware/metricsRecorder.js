/**
 * Middleware to record request durations for Prometheus metrics.
 */

const prometheusMetrics = require('../lib/prometheusMetrics');

function metricsRecorderMiddleware(req, res, next) {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const path = req.route?.path || req.path || 'unknown';

        prometheusMetrics.recordRequestDuration(path, duration);

        // Record errors
        if (res.statusCode >= 400) {
            prometheusMetrics.recordErrorOnPath(path);
        }
    });

    next();
}

module.exports = metricsRecorderMiddleware;
