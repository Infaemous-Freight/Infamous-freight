const { Worker } = require("bullmq");
const { connection } = require("../queue/connection");
const { processDispatch } = require("./processors/dispatch");
const { processExpireOffers, processExpireHolds } = require("./processors/expiry");
const { processEta } = require("./processors/eta");
const { ensureExpirySweepers } = require("../queue/schedule");

function envNum(name, def) {
    const n = Number(process.env[name]);
    return Number.isFinite(n) ? n : def;
}

async function startWorkers() {
    const dispatchConcurrency = envNum("WORKER_CONCURRENCY_DISPATCH", 10);
    const expiryConcurrency = envNum("WORKER_CONCURRENCY_EXPIRY", 5);
    const etaConcurrency = envNum("WORKER_CONCURRENCY_ETA", 2);

    // Dispatch waves
    new Worker(
        "dispatch",
        async (job) => processDispatch(job),
        { connection, concurrency: dispatchConcurrency }
    );

    // Expiry sweepers
    new Worker(
        "expiry",
        async (job) => {
            if (job.name.startsWith("expire-offers")) return processExpireOffers(job);
            return processExpireHolds(job);
        },
        { connection, concurrency: expiryConcurrency }
    );

    // ETA rate-limited worker
    new Worker(
        "eta",
        async (job) => processEta(job),
        {
            connection,
            concurrency: etaConcurrency,
            limiter: {
                max: envNum("ETA_RATE_LIMIT_MAX", 50),
                duration: envNum("ETA_RATE_LIMIT_DURATION_MS", 60_000),
            },
        }
    );

    await ensureExpirySweepers();
}

if (require.main === module) {
    startWorkers().catch((e) => {
        console.error("Worker startup failed", e);
        process.exit(1);
    });
}

module.exports = { startWorkers };
