/**
 * Query Performance Monitoring Service
 * 
 * Comprehensive database query performance tracking, analysis, and optimization recommendations
 * Integration points: Sentry, Winston logger, metrics collection
 * 
 * @version 1.0.0
 * @author Database Performance Team
 */

const logger = require("../utils/logger");
const Sentry = require("@sentry/node");

/**
 * Query metrics storage and analysis
 */
class QueryPerformanceMonitor {
    constructor(options = {}) {
        this.queries = [];
        this.slowQueryThreshold = options.slowQueryThreshold || 100; // ms
        this.criticalThreshold = options.criticalThreshold || 500; // ms
        this.enableMetrics = options.enableMetrics !== false;
        this.maxStoredQueries = options.maxStoredQueries || 1000;

        // Optimization recommendations
        this.recommendations = {
            n1Detection: [],
            missingIndexes: [],
            tableScans: [],
            inefficientJoins: [],
        };

        // Performance baseline
        this.baselines = {
            queryAverage: 0,
            p95: 0,
            p99: 0,
            slowQueryCount: 0,
        };
    }

    /**
     * Record a query execution
     * @param {Object} query - Query details
     * @param {string} query.model - Prisma model name (e.g., 'Shipment')
     * @param {string} query.action - Query action (e.g., 'findMany', 'findUnique')
     * @param {number} query.duration - Execution time in ms
     * @param {Object} query.args - Query arguments (where, select, include)
     * @param {Error} query.error - Any error that occurred
     * @returns {void}
     */
    recordQuery(query) {
        if (!this.enableMetrics) return;

        const record = {
            timestamp: Date.now(),
            model: query.model,
            action: query.action,
            duration: query.duration,
            args: this.sanitizeArgs(query.args),
            error: query.error ? query.error.message : null,
            isSlow: query.duration > this.slowQueryThreshold,
            isCritical: query.duration > this.criticalThreshold,
        };

        this.queries.push(record);

        // Maintain size limit
        if (this.queries.length > this.maxStoredQueries) {
            this.queries.shift();
        }

        // Log slow queries
        if (record.isSlow && !record.error) {
            this.logSlowQuery(record);
        }

        // Log critical queries
        if (record.isCritical) {
            this.logCriticalQuery(record);
        }

        // Send to Sentry for critical queries
        if (record.isCritical) {
            Sentry.captureMessage(`Critical slow query detected: ${record.model}.${record.action} (${record.duration}ms)`, {
                level: "warning",
                tags: {
                    model: record.model,
                    action: record.action,
                    duration: record.duration,
                },
            });
        }
    }

    /**
     * Sanitize query arguments (remove sensitive data)
     * @private
     */
    sanitizeArgs(args) {
        if (!args) return null;

        const sanitized = { ...args };

        // Remove passwords, tokens, PII
        const sensitiveFields = [
            "password",
            "token",
            "apiKey",
            "secret",
            "creditCard",
            "ssn",
        ];

        const sanitizeValue = (val) => {
            if (typeof val === "string" && val.length > 100) {
                return val.substring(0, 100) + "...";
            }
            return val;
        };

        Object.keys(sanitized).forEach((key) => {
            if (sensitiveFields.some((sf) => key.toLowerCase().includes(sf))) {
                sanitized[key] = "[REDACTED]";
            } else {
                sanitized[key] = sanitizeValue(sanitized[key]);
            }
        });

        return sanitized;
    }

    /**
     * Log slow query
     * @private
     */
    logSlowQuery(record) {
        logger.warn(
            `Slow query detected: ${record.model}.${record.action}`,
            {
                model: record.model,
                action: record.action,
                duration: record.duration,
                threshold: this.slowQueryThreshold,
                timestamp: new Date(record.timestamp).toISOString(),
            }
        );
    }

    /**
     * Log critical query
     * @private
     */
    logCriticalQuery(record) {
        logger.error(
            `CRITICAL: Very slow query executed`,
            {
                model: record.model,
                action: record.action,
                duration: record.duration,
                threshold: this.criticalThreshold,
                args: record.args,
                timestamp: new Date(record.timestamp).toISOString(),
            }
        );

        Sentry.addBreadcrumb({
            message: `Critical query: ${record.model}.${record.action}`,
            level: "error",
            data: {
                duration: record.duration,
                model: record.model,
                action: record.action,
            },
        });
    }

    /**
     * Detect N+1 query patterns
     * @returns {Object} N+1 detection results
     */
    detectN1Patterns() {
        const patterns = {};

        // Group queries by model and action
        this.queries.forEach((query) => {
            const key = `${query.model}.${query.action}`;
            if (!patterns[key]) {
                patterns[key] = [];
            }
            patterns[key].push(query);
        });

        // Detect suspicious patterns (many queries in short timeframe)
        const issues = [];
        Object.entries(patterns).forEach(([key, queries]) => {
            if (queries.length > 10) {
                // More than 10 of same query type in recent history
                const recentQueries = queries.filter(
                    (q) => Date.now() - q.timestamp < 5000 // Last 5 seconds
                );

                if (recentQueries.length > 5) {
                    issues.push({
                        pattern: key,
                        count: recentQueries.length,
                        severity: recentQueries.length > 50 ? "critical" : "high",
                        samples: recentQueries.slice(0, 3),
                        recommendation: `Consider using .include() or .select() with relations instead of separate queries`,
                    });
                }
            }
        });

        return issues;
    }

    /**
     * Analyze query performance
     * @returns {Object} Performance analysis
     */
    analyzePerformance() {
        if (this.queries.length === 0) {
            return { status: "No query data available" };
        }

        const durations = this.queries.map((q) => q.duration);
        durations.sort((a, b) => a - b);

        const sum = durations.reduce((a, b) => a + b, 0);
        const average = sum / durations.length;
        const p95 = durations[Math.floor(durations.length * 0.95)];
        const p99 = durations[Math.floor(durations.length * 0.99)];
        const slowCount = durations.filter((d) => d > this.slowQueryThreshold).length;
        const criticalCount = durations.filter((d) => d > this.criticalThreshold).length;

        // Model-specific analysis
        const byModel = {};
        this.queries.forEach((q) => {
            if (!byModel[q.model]) {
                byModel[q.model] = {
                    count: 0,
                    totalDuration: 0,
                    slowCount: 0,
                    actions: {},
                };
            }
            byModel[q.model].count++;
            byModel[q.model].totalDuration += q.duration;
            if (q.isSlow) byModel[q.model].slowCount++;

            if (!byModel[q.model].actions[q.action]) {
                byModel[q.model].actions[q.action] = {
                    count: 0,
                    avgDuration: 0,
                    maxDuration: 0,
                };
            }
            const action = byModel[q.model].actions[q.action];
            action.count++;
            action.avgDuration = (action.avgDuration * (action.count - 1) + q.duration) / action.count;
            action.maxDuration = Math.max(action.maxDuration, q.duration);
        });

        return {
            totalQueries: this.queries.length,
            averageDuration: Math.round(average),
            p95Duration: p95,
            p99Duration: p99,
            slowQueryCount: slowCount,
            criticalQueryCount: criticalCount,
            slowQueryPercentage: ((slowCount / this.queries.length) * 100).toFixed(2) + "%",
            byModel,
            n1Patterns: this.detectN1Patterns(),
        };
    }

    /**
     * Get optimization recommendations
     * @returns {Object} Recommendations
     */
    getRecommendations() {
        const analysis = this.analyzePerformance();
        const recommendations = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
        };

        // Check for N+1 patterns
        if (analysis.n1Patterns && analysis.n1Patterns.length > 0) {
            recommendations.immediate.push({
                type: "N+1 Pattern Detected",
                severity: "high",
                items: analysis.n1Patterns,
                action: "Refactor queries to use .include() or .select() for relations",
            });
        }

        // Check slow query percentage
        const slowPercentage = parseFloat(analysis.slowQueryPercentage);
        if (slowPercentage > 10) {
            recommendations.immediate.push({
                type: "High Slow Query Rate",
                severity: "high",
                percentage: analysis.slowQueryPercentage,
                threshold: this.slowQueryThreshold + "ms",
                action: "Add database indexes on frequently filtered columns",
            });
        }

        // Check critical queries
        if (analysis.criticalQueryCount > 0) {
            recommendations.immediate.push({
                type: "Critical Slow Queries",
                severity: "critical",
                count: analysis.criticalQueryCount,
                action: "Investigate and optimize critical paths (query profiling needed)",
            });
        }

        // Model-specific recommendations
        Object.entries(analysis.byModel || {}).forEach(([model, stats]) => {
            if (stats.slowCount > stats.count * 0.1) {
                recommendations.shortTerm.push({
                    type: `${model} Query Optimization`,
                    severity: "medium",
                    model,
                    slowCount: stats.slowCount,
                    totalCount: stats.count,
                    recommendation: `Profile ${model} queries and add indexes`,
                });
            }
        });

        return recommendations;
    }

    /**
     * Generate performance report
     * @returns {string} Markdown formatted report
     */
    generateReport() {
        const analysis = this.analyzePerformance();
        const recommendations = this.getRecommendations();

        let report = `# Database Query Performance Report\n\n`;
        report += `**Generated**: ${new Date().toISOString()}\n\n`;

        // Summary
        report += `## Summary\n\n`;
        report += `- Total Queries: ${analysis.totalQueries}\n`;
        report += `- Average Duration: ${analysis.averageDuration}ms\n`;
        report += `- P95 Duration: ${analysis.p95Duration}ms\n`;
        report += `- P99 Duration: ${analysis.p99Duration}ms\n`;
        report += `- Slow Queries: ${analysis.slowQueryCount} (${analysis.slowQueryPercentage})\n`;
        report += `- Critical Queries: ${analysis.criticalQueryCount}\n\n`;

        // By Model
        report += `## Performance by Model\n\n`;
        Object.entries(analysis.byModel || {}).forEach(([model, stats]) => {
            report += `### ${model}\n`;
            report += `- Queries: ${stats.count}\n`;
            report += `- Avg Duration: ${Math.round(stats.totalDuration / stats.count)}ms\n`;
            report += `- Slow Count: ${stats.slowCount}\n`;
            report += `- Actions:\n`;
            Object.entries(stats.actions).forEach(([action, actionStats]) => {
                report += `  - ${action}: ${actionStats.count} queries, avg ${Math.round(actionStats.avgDuration)}ms, max ${actionStats.maxDuration}ms\n`;
            });
            report += `\n`;
        });

        // N+1 Detection
        if (analysis.n1Patterns && analysis.n1Patterns.length > 0) {
            report += `## N+1 Query Patterns\n\n`;
            analysis.n1Patterns.forEach((pattern) => {
                report += `### ${pattern.pattern}\n`;
                report += `- Count: ${pattern.count}\n`;
                report += `- Severity: ${pattern.severity}\n`;
                report += `- Recommendation: ${pattern.recommendation}\n\n`;
            });
        }

        // Recommendations
        report += `## Optimization Recommendations\n\n`;
        if (recommendations.immediate.length > 0) {
            report += `### Immediate Actions (Critical)\n`;
            recommendations.immediate.forEach((rec) => {
                report += `- **${rec.type}**: ${rec.action}\n`;
            });
            report += `\n`;
        }

        if (recommendations.shortTerm.length > 0) {
            report += `### Short Term (This Sprint)\n`;
            recommendations.shortTerm.forEach((rec) => {
                report += `- **${rec.type}**: ${rec.recommendation}\n`;
            });
            report += `\n`;
        }

        return report;
    }

    /**
     * Reset metrics
     */
    reset() {
        this.queries = [];
        this.recommendations = {
            n1Detection: [],
            missingIndexes: [],
            tableScans: [],
            inefficientJoins: [],
        };
    }
}

// Export singleton instance
const queryPerformanceMonitor = new QueryPerformanceMonitor({
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || "100"),
    criticalThreshold: parseInt(process.env.CRITICAL_QUERY_THRESHOLD_MS || "500"),
});

module.exports = queryPerformanceMonitor;
