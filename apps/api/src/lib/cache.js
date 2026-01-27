/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Tiny TTL Cache (In-Memory)
 *
 * Simple key-value cache with time-to-live expiration.
 * Phase 15 can migrate this to Redis for distributed caching.
 */

class TinyTTLCache {
    constructor(ttlMs) {
        this.ttlMs = ttlMs;
        this.map = new Map();
    }

    /**
     * Get a value from cache
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {
        const entry = this.map.get(key);
        if (!entry) return null;

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.map.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Set a value in cache
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
        this.map.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs,
        });
    }

    /**
     * Clear all entries
     */
    clear() {
        this.map.clear();
    }

    /**
     * Get cache size (active entries only)
     */
    size() {
        let count = 0;
        for (const entry of this.map.values()) {
            if (Date.now() <= entry.expiresAt) {
                count++;
            }
        }
        return count;
    }
}

module.exports = { TinyTTLCache };
