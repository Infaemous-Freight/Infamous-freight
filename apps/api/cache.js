// api/cache.js - Response Caching Module
class Cache {
    constructor(ttl = 5000) {
        this.store = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        this.store.set(key, {
            value,
            timestamp: Date.now()
        });
        // Cleanup old entries periodically
        if (Math.random() < 0.01) {
            this.cleanup();
        }
    }

    get(key) {
        const item = this.store.get(key);
        if (!item) return null;

        const age = Date.now() - item.timestamp;
        if (age > this.ttl) {
            this.store.delete(key);
            return null;
        }

        return item.value;
    }

    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.store.entries()) {
            if (now - item.timestamp > this.ttl) {
                this.store.delete(key);
            }
        }
    }

    clear() {
        this.store.clear();
    }

    stats() {
        return {
            size: this.store.size,
            items: Array.from(this.store.keys())
        };
    }
}

module.exports = Cache;
