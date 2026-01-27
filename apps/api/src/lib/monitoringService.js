/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Monitoring & Alerting Configuration
 * Integrates with Datadog, Sentry, and CloudWatch
 */

const Sentry = require('@sentry/node');
const StatsD = require('node-statsd').StatsD;
const logger = require('./structuredLogging');

class MonitoringService {
    constructor() {
        this.statsd = null;
        this.sentryEnabled = false;
        this.datadogEnabled = false;
        this.alertThresholds = {
            errorRate: 0.05, // 5%
            webhookFailureRate: 0.1, // 10%
            responseTimeP95: 5000, // 5 seconds
            dbSlowQueryThreshold: 1000, // 1 second
            cpuUsage: 80, // 80%
            memoryUsage: 85, // 85%
            diskUsage: 90, // 90%
        };

        this.initializeSentry();
        this.initializeDatadog();
    }

    /**
     * Initialize Sentry for error tracking
     */
    initializeSentry() {
        if (!process.env.SENTRY_DSN) {
            logger.warn('Sentry not configured');
            return;
        }

        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: 1.0,
            integrations: [
                new Sentry.Integrations.Http({ tracing: true }),
                new Sentry.Integrations.OnUncaughtException(),
                new Sentry.Integrations.OnUnhandledRejection(),
            ],
        });

        this.sentryEnabled = true;
        logger.info('Sentry initialized');
    }

    /**
     * Initialize Datadog StatsD client
     */
    initializeDatadog() {
        if (!process.env.DD_AGENT_HOST) {
            logger.warn('Datadog not configured');
            return;
        }

        this.statsd = new StatsD({
            host: process.env.DD_AGENT_HOST || 'localhost',
            port: process.env.DD_AGENT_PORT || 8125,
            prefix: process.env.DD_METRIC_PREFIX || 'marketplace.',
            tags: [
                `env:${process.env.NODE_ENV || 'development'}`,
                `service:api`,
            ],
        });

        this.datadogEnabled = true;
        logger.info('Datadog StatsD initialized');
    }

    /**
     * Track API request metrics
     */
    trackRequest(method, path, statusCode, duration) {
        if (this.datadogEnabled && this.statsd) {
            // Track request count
            this.statsd.increment('requests.total', 1, {
                method,
                path,
                status: statusCode,
            });

            // Track request duration
            this.statsd.timing('requests.duration_ms', duration, {
                method,
                path,
                status: statusCode,
            });

            // Track error rate
            if (statusCode >= 500) {
                this.statsd.increment('requests.errors', 1, {
                    method,
                    path,
                    status: statusCode,
                });
            }
        }
    }

    /**
     * Track database query performance
     */
    trackDatabaseQuery(operation, table, duration) {
        if (this.datadogEnabled && this.statsd) {
            this.statsd.timing('db.query.duration_ms', duration, {
                operation,
                table,
            });

            if (duration > this.alertThresholds.dbSlowQueryThreshold) {
                this.statsd.increment('db.slow_queries', 1, {
                    operation,
                    table,
                });

                this.createAlert('SLOW_QUERY', {
                    message: `Slow database query detected: ${operation} on ${table} took ${duration}ms`,
                    severity: 'warning',
                    table,
                    operation,
                    duration,
                });
            }
        }
    }

    /**
     * Track webhook processing
     */
    trackWebhookEvent(eventType, status, duration) {
        if (this.datadogEnabled && this.statsd) {
            this.statsd.increment('webhooks.processed', 1, {
                type: eventType,
                status,
            });

            this.statsd.timing('webhooks.duration_ms', duration, {
                type: eventType,
            });

            if (status === 'failed') {
                this.statsd.increment('webhooks.failures', 1, {
                    type: eventType,
                });
            }
        }
    }

    /**
     * Track job events
     */
    trackJobEvent(eventType, jobId) {
        if (this.datadogEnabled && this.statsd) {
            this.statsd.increment('jobs.events', 1, {
                event: eventType,
            });
        }

        if (this.sentryEnabled) {
            Sentry.captureMessage(`Job event: ${eventType}`, 'info', {
                extra: { jobId, eventType },
            });
        }
    }

    /**
     * Track payment transaction
     */
    trackPayment(status, amount, plan) {
        if (this.datadogEnabled && this.statsd) {
            this.statsd.increment('payments.total', 1, {
                status,
                plan,
            });

            this.statsd.gauge('payments.amount_cents', amount, {
                plan,
            });
        }
    }

    /**
     * Track performance metrics
     */
    trackPerformanceMetric(name, value, tags = {}) {
        if (this.datadogEnabled && this.statsd) {
            this.statsd.gauge(`performance.${name}`, value, tags);
        }
    }

    /**
     * Report error to Sentry
     */
    reportError(error, context = {}) {
        if (this.sentryEnabled) {
            Sentry.captureException(error, {
                tags: {
                    'error.type': error.constructor.name,
                },
                extra: context,
            });
        }

        logger.error('Error reported', {
            error: error.message,
            context,
        });
    }

    /**
     * Create alert for critical issues
     */
    createAlert(alertType, details) {
        logger.warn(`ALERT: ${alertType}`, details);

        if (this.datadogEnabled && this.statsd) {
            this.statsd.increment('alerts', 1, {
                type: alertType,
                severity: details.severity || 'warning',
            });
        }

        if (this.sentryEnabled) {
            Sentry.captureMessage(`Alert: ${alertType}`, 'warning', {
                extra: details,
            });
        }

        // TODO: Send to alerting system (PagerDuty, etc.)
    }

    /**
     * Check error rate and trigger alert if exceeded
     */
    async checkErrorRateAlert(totalRequests, errorCount) {
        const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

        if (errorRate > this.alertThresholds.errorRate) {
            this.createAlert('HIGH_ERROR_RATE', {
                errorRate: (errorRate * 100).toFixed(2),
                totalRequests,
                errorCount,
                threshold: (this.alertThresholds.errorRate * 100).toFixed(2),
                severity: 'critical',
            });
        }
    }

    /**
     * Check webhook failure rate and trigger alert
     */
    async checkWebhookFailureAlert(totalWebhooks, failedWebhooks) {
        const failureRate = totalWebhooks > 0 ? failedWebhooks / totalWebhooks : 0;

        if (failureRate > this.alertThresholds.webhookFailureRate) {
            this.createAlert('HIGH_WEBHOOK_FAILURE_RATE', {
                failureRate: (failureRate * 100).toFixed(2),
                totalWebhooks,
                failedWebhooks,
                threshold: (this.alertThresholds.webhookFailureRate * 100).toFixed(2),
                severity: 'critical',
            });
        }
    }

    /**
     * Get health metrics
     */
    async getHealthMetrics() {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();

        return {
            uptime,
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024),
            },
            timestamp: new Date().toISOString(),
            monitoring: {
                sentryEnabled: this.sentryEnabled,
                datadogEnabled: this.datadogEnabled,
            },
        };
    }

    /**
     * Create middleware for request monitoring
     */
    getMonitoringMiddleware() {
        return (req, res, next) => {
            const start = Date.now();

            res.on('finish', () => {
                const duration = Date.now() - start;
                this.trackRequest(req.method, req.path, res.statusCode, duration);

                // Alert on very slow requests
                if (duration > this.alertThresholds.responseTimeP95) {
                    logger.warn('Slow request detected', {
                        method: req.method,
                        path: req.path,
                        duration,
                        status: res.statusCode,
                    });
                }
            });

            next();
        };
    }

    /**
     * Create error handler middleware
     */
    getErrorHandlingMiddleware() {
        return (err, req, res, next) => {
            this.reportError(err, {
                method: req.method,
                path: req.path,
                ip: req.ip,
                userId: req.user?.sub,
            });

            next(err);
        };
    }
}

// Singleton
let instance = null;

function getInstance() {
    if (!instance) {
        instance = new MonitoringService();
    }
    return instance;
}

module.exports = {
    getInstance,
    MonitoringService,
};
