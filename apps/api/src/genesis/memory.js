// In-memory message history for Phase-6 (CI-safe, no external services)
const history = new Map();

function getHistory(userId, limit = 12) {
    const arr = history.get(userId) || [];
    return arr.slice(-limit);
}

function addMessage(userId, role, content) {
    const arr = history.get(userId) || [];
    arr.push({ role, content, ts: Date.now() });
    // keep a small rolling window to avoid unbounded growth
    history.set(userId, arr.slice(-50));
    return arr;
}

module.exports = {
    getHistory,
    addMessage,
};
