/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Query Performance Monitoring
 *
 * Monitors Prisma queries and logs slow queries to help with performance optimization.
 */

const { logger } = require('./logger');

class QueryMonitor {
    constructor(options = {}) {
        this.slowQueryThreshold = options.slowQueryThreshold || 500;  // ms
        this.verySlowQueryThreshold = options.verySlowQueryThreshold || 2000;  // ms
        this.enableDetailedLogging = options.enableDetailedLogging || process.env.ENABLE_QUERY_LOGGING === 'true';
        this.queries = [];
        this.slowQueries = [];
    }

    /**
     * Called whenever a query is executed
     */
    onQuery({ query, duration, params }) {
        const queryLog = {
            query: query.substring(0, 200),  // First 200 chars
            duration,
            params,
            timestamp: new Date().toISOString(),
        };

        // Track all queries (for analytics)
        this.queries.push(queryLog);
        if (this.queries.length > 1000) {
            this.queries.shift();  // Keep recent queries only
        }

        // Log very slow queries (> 2s)
        if (duration > this.verySlowQueryThreshold) {
            logger.error({
                query,
                duration,
                params,
                severity: 'very_slow',
            }, `⚠️ VERY SLOW QUERY (${duration}ms) - Exceeds ${this.verySlowQueryThreshold}ms threshold`);

            this.slowQueries.push(queryLog);
            if (this.slowQueries.length > 100) {
                this.slowQueries.shift();
            }
        }
        // Log slow queries (> threshold)
        else if (duration > this.slowQueryThreshold) {
            logger.warn({
                query: query.substring(0, 500),
                duration,
                params,
                severity: 'slow',
            }, `🐢 Slow query (${duration}ms)`);
        }
        // Detailed logging if enabled
        else if (this.enableDetailedLogging) {
            logger.debug({
                query: query.substring(0, 200),
                duration,
            }, `Query executed in ${duration}ms`);
        }
    }

    /**
     * Get statistics about queries
     */
    getStats() {
        const durations = this.queries.map(q => q.duration);
        const totalQueries = this.queries.length;
        const slowQueryCount = this.slowQueries.length;
        const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b) / durations.length : 0;
        const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

        return {
            totalQueries,
            slowQueryCount,
            averageDuration: Math.round(avgDuration),
            maxDuration,
            threshold: this.slowQueryThreshold,
            slowPercentage: totalQueries > 0 ? ((slowQueryCount / totalQueries) * 100).toFixed(2) : 0,
        };
    }

    /**
     * Get top slow queries
     */
    getTopSlowQueries(limit = 10) {
        return this.slowQueries
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit)
            .map((q, i) => ({
                rank: i + 1,
                query: q.query,
                duration: `${q.duration}ms`,
            }));
    }

    /**
     * Reset statistics
     */
    reset() {
        this.queries = [];
        this.slowQueries = [];
    }
}

/**
 * Create monitor instance
 */
const queryMonitor = new QueryMonitor({
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_MS || '500'),
    verySlowQueryThreshold: parseInt(process.env.VERY_SLOW_QUERY_MS || '2000'),
    enableDetailedLogging: process.env.ENABLE_QUERY_LOGGING === 'true',
});

module.exports = {
    queryMonitor,
    QueryMonitor,
};
