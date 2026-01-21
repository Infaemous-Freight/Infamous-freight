/**
 * Prisma query event listener for slow query logging.
 * Logs queries exceeding SLOW_QUERY_THRESHOLD_MS to console and Sentry.
 */

const { logger } = require('../middleware/logger');
const Sentry = require('@sentry/node');

const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '1000', 10);

function attachSlowQueryLogger(prisma) {
    prisma.$on('query', (e) => {
        const durationMs = e.duration;

        if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
            const query = e.query.substring(0, 200); // Truncate for safety
            const severity = durationMs > 5000 ? 'error' : 'warn';

            logger[severity]({
                message: 'Slow query detected',
                query,
                duration: durationMs,
                threshold: SLOW_QUERY_THRESHOLD_MS,
                params: e.params ? JSON.stringify(e.params).substring(0, 100) : undefined,
            });

            // Send to Sentry for monitoring
            if (Sentry && process.env.SENTRY_DSN) {
                Sentry.captureMessage(`Slow query (${durationMs}ms): ${query}`, 'warning', {
                    tags: {
                        query_duration: durationMs,
                        threshold: SLOW_QUERY_THRESHOLD_MS,
                    },
                    extra: {
                        query: query,
                        params: e.params ? JSON.stringify(e.params).substring(0, 100) : undefined,
                    },
                });
            }
        }
    });

    return prisma;
}

module.exports = { attachSlowQueryLogger, SLOW_QUERY_THRESHOLD_MS };
