const IORedis = require("ioredis");

function redisConnection() {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    return new IORedis(url, {
        maxRetriesPerRequest: null, // recommended for BullMQ
        enableReadyCheck: true,
        lazyConnect: false,
    });
}

module.exports = { redisConnection };
