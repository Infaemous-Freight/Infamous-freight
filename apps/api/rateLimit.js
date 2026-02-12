// apps/api/rateLimit.js - Rate Limiting Module
class RateLimiter {
    constructor(windowMs = 60000, maxRequests = 100) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.requests = new Map();
    }

    isAllowed(identifier) {
        const now = Date.now();

        if (!this.requests.has(identifier)) {
            this.requests.set(identifier, []);
        }

        // Remove old requests outside the window
        const timestamps = this.requests.get(identifier);
        const recentRequests = timestamps.filter(t => now - t < this.windowMs);

        if (recentRequests.length >= this.maxRequests) {
            return false;
        }

        recentRequests.push(now);
        this.requests.set(identifier, recentRequests);

        // Cleanup empty entries periodically
        if (Math.random() < 0.01) {
            for (const [key, times] of this.requests.entries()) {
                if (times.length === 0 || times.every(t => now - t > this.windowMs)) {
                    this.requests.delete(key);
                }
            }
        }

        return true;
    }

    reset(identifier) {
        this.requests.delete(identifier);
    }

    stats() {
        return {
            identifiers: this.requests.size,
            total: Array.from(this.requests.values()).reduce((sum, times) => sum + times.length, 0)
        };
    }
}

module.exports = RateLimiter;
