/*
 * Redis JSON Cache Helper
 * Provides get/set for JSON payloads with TTL, using ioredis.
 */

const { redisConnection } = require("../queue/redis");

let client = null;

function getClient() {
    try {
        if (!client) {
            client = redisConnection();
        }
        return client;
    } catch (e) {
        return null;
    }
}

async function cacheGetJson(key) {
    const c = getClient();
    if (!c) return null;
    try {
        const raw = await c.get(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

async function cacheSetJson(key, value, ttlSeconds) {
    const c = getClient();
    if (!c) return false;
    try {
        const payload = JSON.stringify(value);
        if (ttlSeconds && Number.isFinite(ttlSeconds)) {
            await c.setex(key, ttlSeconds, payload);
        } else {
            await c.set(key, payload);
        }
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    cacheGetJson,
    cacheSetJson,
};
