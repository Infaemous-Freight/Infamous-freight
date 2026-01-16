const { PrismaClient } = require("@prisma/client");
const { getEligibleDriversForJob, expireOffersForJob } = require("./offers");

const prisma = new PrismaClient();

function envNum(name, def) {
    const n = Number(process.env[name]);
    return Number.isFinite(n) ? n : def;
}

function envBool(name, def) {
    const v = process.env[name];
    if (v == null) return def;
    return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

function waveConfig() {
    const radiusMiles = envNum("WAVE_RADIUS_MILES", 10);

    return {
        radiusMiles,
        wave1: { count: envNum("WAVE1_COUNT", 3), expirySeconds: envNum("WAVE1_EXPIRY_SECONDS", 30) },
        wave2: { count: envNum("WAVE2_COUNT", 10), expirySeconds: envNum("WAVE2_EXPIRY_SECONDS", 30) },
        wave3: {
            enabled: envBool("WAVE3_ENABLED", true),
            count: envNum("WAVE3_COUNT", 50),
            expirySeconds: envNum("WAVE3_EXPIRY_SECONDS", 60),
        },
    };
}

function nextWaveFrom(currentWave) {
    if (currentWave === 1) return 2;
    if (currentWave === 2) return 3;
    return null;
}

async function runWave(params) {
    const cfg = waveConfig();
    const waveDef = params.wave === 1 ? cfg.wave1 : params.wave === 2 ? cfg.wave2 : cfg.wave3;

    if (params.wave === 3 && !cfg.wave3.enabled) {
        return { skipped: true, reason: "WAVE3_DISABLED" };
    }

    const expirySeconds = waveDef.expirySeconds;
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    // Expire stale offers before fanout
    await expireOffersForJob(params.jobId);

    // Exclude drivers already offered for this job
    const existingOffers = await prisma.jobOffer.findMany({
        where: { jobId: params.jobId },
        select: { driverId: true },
    });
    const excludeDriverIds = existingOffers.map((o) => o.driverId);

    const { eligible } = await getEligibleDriversForJob({
        jobId: params.jobId,
        radiusMiles: cfg.radiusMiles,
        limit: waveDef.count + excludeDriverIds.length,
        excludeDriverIds,
    });

    const created = await prisma.$transaction(async (tx) => {
        // Job must still be OPEN and unassigned
        const job = await tx.job.findUnique({ where: { id: params.jobId }, include: { payment: true } });
        if (!job) throw new Error("Job not found");
        if (job.status !== "OPEN") throw new Error(`Job not OPEN (is ${job.status})`);
        if (job.driverId) throw new Error("Job already assigned");
        if (!job.payment || job.payment.status !== "SUCCEEDED") throw new Error("Job not paid");

        const offers = [];

        for (let i = 0; i < eligible.length && offers.length < waveDef.count; i++) {
            const e = eligible[i];
            const offer = await tx.jobOffer.upsert({
                where: { jobId_driverId: { jobId: params.jobId, driverId: e.driver.id } },
                create: {
                    jobId: params.jobId,
                    driverId: e.driver.id,
                    status: "OFFERED",
                    expiresAt,
                    rank: e.rank,
                    wave: params.wave,
                    distanceMiles: e.distanceMiles,
                },
                update: {
                    status: "OFFERED",
                    expiresAt,
                    rank: e.rank,
                    wave: params.wave,
                    distanceMiles: e.distanceMiles,
                    acceptedAt: null,
                },
            });

            offers.push({
                offerId: offer.id,
                driverId: e.driver.id,
                distanceMiles: e.distanceMiles,
                rank: e.rank,
                wave: params.wave,
                expiresAt,
                expoPushToken: e.driver.expoPushToken,
            });
        }

        await tx.jobEvent.create({
            data: {
                jobId: params.jobId,
                type: "NOTE",
                actorUserId: null,
                message: `Wave ${params.wave} offers sent: count=${offers.length} expiry=${expirySeconds}s`,
            },
        });

        const nextWave = nextWaveFrom(params.wave);
        const nextWaveEnabled = !(nextWave === 3 && !cfg.wave3.enabled);
        const nextAt = nextWave && nextWaveEnabled ? new Date(Date.now() + expirySeconds * 1000) : null;

        await tx.job.update({
            where: { id: params.jobId },
            data: {
                offerWave: params.wave,
                offerWaveStartedAt: params.wave === 1 && !job.offerWaveStartedAt ? new Date() : job.offerWaveStartedAt,
                offerWaveNextAt: nextAt,
            },
        });

        return { offers, expiresAt, nextWave: nextWaveEnabled ? nextWave : null, nextAt };
    });

    return { ok: true, wave: params.wave, ...created };
}

module.exports = {
    waveConfig,
    runWave,
    nextWaveFrom,
};
