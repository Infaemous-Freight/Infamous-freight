const DEFAULT_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || "100", 10);
let slowQueries = [];

function recordQuery({ model, action, duration, args, error }) {
    const entry = {
        model,
        action,
        duration,
        args,
        error: error ? error.message : undefined,
        timestamp: Date.now(),
    };

    if (duration >= DEFAULT_THRESHOLD || error) {
        slowQueries.unshift(entry);
        slowQueries = slowQueries.slice(0, 100);
    }
}

function getSlowQueries(limit = 50) {
    return slowQueries.slice(0, limit);
}

function clearSlowQueries() {
    slowQueries = [];
}

function clear() {
    slowQueries = [];
}

module.exports = {
    recordQuery,
    getSlowQueries,
    clearSlowQueries,
    clear,
    DEFAULT_THRESHOLD,
};
