const { Queue } = require("bullmq");
const config = require("../config");

function getRedisConnectionOptions() {
  const host = config.REDIS_HOST || process.env.REDIS_HOST || "127.0.0.1";
  const port = Number(config.REDIS_PORT || process.env.REDIS_PORT || 6379);
  const password = config.REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined;

  return { host, port, password };
}

const aiCommandQueue = new Queue("ai-commands", {
  connection: getRedisConnectionOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
});

module.exports = { aiCommandQueue };
