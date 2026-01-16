const stats = new Map();

function ensureLimiter(name) {
    if (!stats.has(name)) {
        stats.set(name, {
            hits: 0,
            blocked: 0,
            successes: 0,
            lastUpdated: null,
            keys: new Map(),
        });
    }
    return stats.get(name);
}

function recordHit(name, key) {
    const entry = ensureLimiter(name);
    entry.hits += 1;
    entry.lastUpdated = Date.now();
    if (key) {
        entry.keys.set(key, (entry.keys.get(key) || 0) + 1);
    }
}

function recordBlocked(name, key) {
    const entry = ensureLimiter(name);
    entry.blocked += 1;
    entry.lastUpdated = Date.now();
    if (key) {
        entry.keys.set(`${key}:blocked`, (entry.keys.get(`${key}:blocked`) || 0) + 1);
    }
}

function recordSuccess(name) {
    const entry = ensureLimiter(name);
    entry.successes += 1;
    entry.lastUpdated = Date.now();
}

function snapshot() {
    const result = {};
    for (const [name, value] of stats.entries()) {
        const topKeys = Array.from(value.keys.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([key, count]) => ({ key, count }));

        result[name] = {
            hits: value.hits,
            blocked: value.blocked,
            success: value.successes,
            lastUpdated: value.lastUpdated,
            topKeys,
            blockedKeys: Array.from(value.keys.entries())
                .filter(([key]) => key.includes(":blocked"))
                .map(([key]) => key.replace(":blocked", "")),
        };
    }
    return result;
}

function reset() {
    stats.clear();
}

module.exports = {
    recordHit,
    recordBlocked,
    recordSuccess,
    snapshot,
    reset,
};
