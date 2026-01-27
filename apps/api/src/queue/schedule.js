const { dispatchQueue, expiryQueue } = require("./queues");

async function enqueueWave(jobId, wave, delayMs = 0) {
    const payload = { jobId, wave };
    const jobName = `wave:${jobId}:${wave}`; // deterministic id prevents duplicates
    return dispatchQueue.add(jobName, payload, {
        delay: delayMs,
        attempts: 3,
        backoff: { type: "exponential", delay: 500 },
        removeOnComplete: true,
        removeOnFail: false,
    });
}

async function ensureExpirySweepers() {
    const offerEvery = Number(process.env.OFFER_EXPIRY_SWEEP_SECONDS || "15") * 1000;
    const holdEvery = Number(process.env.HOLD_EXPIRY_SWEEP_SECONDS || "15") * 1000;

    await expiryQueue.add(
        "expire-offers-global",
        { scope: "global" },
        {
            repeat: { every: offerEvery },
            removeOnComplete: true,
            removeOnFail: false,
        },
    );

    await expiryQueue.add(
        "expire-holds-global",
        { scope: "global" },
        {
            repeat: { every: holdEvery },
            removeOnComplete: true,
            removeOnFail: false,
        },
    );
}

module.exports = { enqueueWave, ensureExpirySweepers };
