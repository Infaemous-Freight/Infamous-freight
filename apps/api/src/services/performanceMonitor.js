/**
 * Performance Monitoring & Instrumentation Service
 * 
 * Application Performance Monitoring (APM) with Sentry integration
 * Tracks transactions, spans, and custom measurements
 * 
 * @version 1.0.0
 * @author Performance Engineering Team
 */

const Sentry = require("@sentry/node");
const logger = require("../utils/logger");

/**
 * Performance Monitor
 * Tracks application performance metrics and sends to Sentry
 */
class PerformanceMonitor {
    constructor() {
        this.transactions = [];
        this.measurements = {};
        this.maxTransactions = 1000;
        this.enableAPM = process.env.SENTRY_APM_ENABLED !== "false";

        // Performance budgets (milliseconds)
        this.budgets = {
            apiEndpoint: 500,
            databaseQuery: 200,
            externalAPI: 3000,
            pageLoad: 3000,
            userInteraction: 200,
        };
    }

    /**
     * Start performance transaction
     * @param {string} name - Transaction name
     * @param {string} op - Operation type (e.g., 'http.request', 'db.query')
     * @returns {Sentry.Transaction} Sentry transaction
     */
    startTransaction(name, op = "operation") {
        if (!this.enableAPM) return null;

        const transaction = Sentry.startTransaction({
            name,
            op,
            description: name,
            tracesSampleRate: 1.0,
        });

        const record = {
            id: transaction.spanId || generateId(),
            name,
            op,
            startTime: Date.now(),
            endTime: null,
            duration: null,
            spans: [],
            metrics: {},
            status: "active",
        };

        this.transactions.push(record);
        if (this.transactions.length > this.maxTransactions) {
            this.transactions.shift();
        }

        return transaction;
    }

    /**
     * Record span within transaction
     * @param {Sentry.Transaction} transaction - Parent transaction
     * @param {string} name - Span name
     * @param {string} op - Operation type
     * @param {Function} callback - Span callback
     * @returns {any} Callback result
     */
    async recordSpan(transaction, name, op, callback) {
        if (!transaction) {
            return callback();
        }

        const span = transaction.startChild({ op, description: name });
        const startTime = Date.now();

        try {
            const result = await callback(span);
            span.end();
            return result;
        } catch (error) {
            span.setStatus("error");
            span.end();
            throw error;
        }
    }

    /**
     * End transaction and record metrics
     * @param {Sentry.Transaction} transaction - Transaction to end
     * @param {Object} metadata - Additional metadata
     */
    endTransaction(transaction, metadata = {}) {
        if (!transaction) return;

        transaction.setStatus("ok");
        transaction.end();

        const record = this.transactions.find((t) => t.id === transaction.spanId);
        if (record) {
            record.endTime = Date.now();
            record.duration = record.endTime - record.startTime;
            record.status = "completed";
            record.metadata = metadata;

            // Check performance budget
            const budget = this.budgets[record.op] || 1000;
            if (record.duration > budget) {
                logger.warn(`Performance budget exceeded: ${record.name}`, {
                    op: record.op,
                    duration: record.duration,
                    budget,
                    exceeded: record.duration - budget,
                });

                Sentry.addBreadcrumb({
                    category: "performance",
                    message: `Budget exceeded: ${record.name}`,
                    level: "warning",
                    data: {
                        op: record.op,
                        duration: record.duration,
                        budget,
                    },
                });
            }
        }
    }

    /**
     * Record custom measurement
     * @param {string} name - Measurement name
     * @param {number} value - Measurement value
     * @param {string} unit - Unit of measurement
     */
    recordMeasurement(name, value, unit = "ms") {
        if (!this.enableAPM) return;

        if (!this.measurements[name]) {
            this.measurements[name] = [];
        }

        this.measurements[name].push({
            timestamp: Date.now(),
            value,
            unit,
        });

        // Keep last 100 measurements per metric
        if (this.measurements[name].length > 100) {
            this.measurements[name].shift();
        }

        Sentry.captureMessage(`Performance measurement: ${name}`, {
            level: "info",
            measurements: {
                [name]: {
                    value,
                    unit,
                },
            },
        });
    }

    /**
     * Track HTTP request performance
     * @param {Express.Request} req - Express request
     * @param {number} statusCode - HTTP status code
     * @param {number} duration - Request duration in ms
     */
    trackHTTPRequest(req, statusCode, duration) {
        if (!this.enableAPM) return;

        const endpoint = `${req.method} ${req.path}`;

        this.recordMeasurement("http.request.duration", duration, "ms");
        this.recordMeasurement(`http.${statusCode}`, 1, "count");

        logger.debug(`HTTP request completed`, {
            method: req.method,
            path: req.path,
            status: statusCode,
            duration,
        });

        // Alert on slow requests
        const budget = this.budgets.apiEndpoint;
        if (duration > budget) {
            logger.warn(`Slow HTTP request: ${endpoint}`, {
                status: statusCode,
                duration,
                budget,
            });

            Sentry.captureMessage(`Slow HTTP request: ${endpoint}`, {
                level: "warning",
                tags: {
                    method: req.method,
                    path: req.path,
                    status: statusCode,
                },
                measurements: {
                    "http.request.duration": {
                        value: duration,
                        unit: "ms",
                    },
                },
            });
        }
    }

    /**
     * Track database query performance
     * @param {string} model - Prisma model name
     * @param {string} action - Query action
     * @param {number} duration - Query duration in ms
     */
    trackDatabaseQuery(model, action, duration) {
        if (!this.enableAPM) return;

        const queryType = `${model}.${action}`;

        this.recordMeasurement(`db.query.duration`, duration, "ms");
        this.recordMeasurement(`db.${model}.${action}`, 1, "count");

        // Alert on slow queries
        const budget = this.budgets.databaseQuery;
        if (duration > budget) {
            logger.warn(`Slow database query: ${queryType}`, {
                duration,
                budget,
                model,
                action,
            });

            Sentry.captureMessage(`Slow database query: ${queryType}`, {
                level: "warning",
                tags: {
                    model,
                    action,
                },
                measurements: {
                    "db.query.duration": {
                        value: duration,
                        unit: "ms",
                    },
                },
            });
        }
    }

    /**
     * Track external API call performance
     * @param {string} service - External service name
     * @param {string} endpoint - API endpoint
     * @param {number} duration - Call duration in ms
     * @param {number} statusCode - HTTP status
     */
    trackExternalAPI(service, endpoint, duration, statusCode) {
        if (!this.enableAPM) return;

        this.recordMeasurement(`external_api.${service}.duration`, duration, "ms");
        this.recordMeasurement(`external_api.${service}.${statusCode}`, 1, "count");

        // Alert on slow external calls
        const budget = this.budgets.externalAPI;
        if (duration > budget) {
            logger.warn(`Slow external API call: ${service}/${endpoint}`, {
                service,
                endpoint,
                duration,
                budget,
                status: statusCode,
            });

            Sentry.captureMessage(`Slow external API: ${service}`, {
                level: "warning",
                tags: {
                    service,
                    endpoint,
                    status: statusCode,
                },
                measurements: {
                    "external_api.duration": {
                        value: duration,
                        unit: "ms",
                    },
                },
            });
        }
    }

    /**
     * Get performance statistics
     * @returns {Object} Performance stats
     */
    getStatistics() {
        const completedTransactions = this.transactions.filter((t) => t.status === "completed");

        if (completedTransactions.length === 0) {
            return { status: "No completed transactions" };
        }

        const durations = completedTransactions.map((t) => t.duration);
        durations.sort((a, b) => a - b);

        const average = durations.reduce((a, b) => a + b, 0) / durations.length;
        const p95 = durations[Math.floor(durations.length * 0.95)];
        const p99 = durations[Math.floor(durations.length * 0.99)];

        const byOp = {};
        completedTransactions.forEach((t) => {
            if (!byOp[t.op]) {
                byOp[t.op] = { count: 0, totalDuration: 0, avgDuration: 0, maxDuration: 0 };
            }
            byOp[t.op].count++;
            byOp[t.op].totalDuration += t.duration;
            byOp[t.op].maxDuration = Math.max(byOp[t.op].maxDuration, t.duration);
            byOp[t.op].avgDuration = byOp[t.op].totalDuration / byOp[t.op].count;
        });

        // Check budget violations
        const budgetViolations = [];
        Object.entries(byOp).forEach(([op, stats]) => {
            const budget = this.budgets[op] || 1000;
            if (stats.avgDuration > budget) {
                budgetViolations.push({
                    op,
                    avgDuration: Math.round(stats.avgDuration),
                    budget,
                    exceeded: Math.round(stats.avgDuration - budget),
                });
            }
        });

        return {
            totalTransactions: completedTransactions.length,
            averageDuration: Math.round(average),
            p95Duration: p95,
            p99Duration: p99,
            byOperation: byOp,
            budgetViolations,
            measurements: Object.keys(this.measurements),
        };
    }

    /**
     * Generate performance report
     * @returns {string} Markdown report
     */
    generateReport() {
        const stats = this.getStatistics();

        let report = `# Performance Monitoring Report\n\n`;
        report += `**Generated**: ${new Date().toISOString()}\n\n`;

        if (typeof stats.status !== "undefined") {
            report += `${stats.status}\n\n`;
            return report;
        }

        report += `## Summary\n\n`;
        report += `- Total Transactions: ${stats.totalTransactions}\n`;
        report += `- Average Duration: ${stats.averageDuration}ms\n`;
        report += `- P95 Duration: ${stats.p95Duration}ms\n`;
        report += `- P99 Duration: ${stats.p99Duration}ms\n\n`;

        report += `## Performance by Operation\n\n`;
        Object.entries(stats.byOperation || {}).forEach(([op, metrics]) => {
            const budget = this.budgets[op] || 1000;
            const status = metrics.avgDuration > budget ? "⚠️ OVER BUDGET" : "✅";
            report += `### ${op} ${status}\n`;
            report += `- Count: ${metrics.count}\n`;
            report += `- Average: ${Math.round(metrics.avgDuration)}ms (Budget: ${budget}ms)\n`;
            report += `- Max: ${Math.round(metrics.maxDuration)}ms\n\n`;
        });

        if (stats.budgetViolations && stats.budgetViolations.length > 0) {
            report += `## ⚠️ Budget Violations\n\n`;
            stats.budgetViolations.forEach((violation) => {
                report += `- **${violation.op}**: ${violation.avgDuration}ms (budget ${violation.budget}ms, exceeded by ${violation.exceeded}ms)\n`;
            });
        }

        return report;
    }
}

/**
 * Generate unique ID
 * @private
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
