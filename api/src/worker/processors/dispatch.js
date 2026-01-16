const { Job: BullJob } = require("bullmq");
const { PrismaClient } = require("@prisma/client");
const { runWave, waveConfig } = require("../../marketplace/waves");
const { enqueueWave } = require("../../queue/schedule");
const { notifier } = require("../../notify/index");

const prisma = new PrismaClient();

async function processDispatch(job /** @type {BullJob} */) {
    const { jobId, wave } = job.data;
    const cfg = waveConfig();

    const j = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true, driverId: true } });
    if (!j || j.status !== "OPEN" || j.driverId) {
        return { skipped: true, reason: "JOB_NOT_OPEN_OR_ASSIGNED" };
    }

    const waveResult = await runWave({ jobId, wave });

    const offers = (waveResult && waveResult.offers) || [];
    if (offers.length) {
        const n = notifier();
        await Promise.all(
            offers.map(async (offer) => {
                try {
                    if (offer.expoPushToken) {
                        await n.pushExpo(offer.expoPushToken, {
                            title: "New delivery offer",
                            body: `Job near you (wave ${wave})`,
                            data: { jobId, offerId: offer.offerId, rank: offer.rank, wave },
                        });
                    }
                } catch (_) { }
            })
        );
    }

    // Schedule next wave automatically when due
    const nextWave = wave === 1 ? 2 : wave === 2 ? 3 : null;
    if (nextWave && !(nextWave === 3 && !cfg.wave3.enabled)) {
        const expirySeconds = wave === 1 ? cfg.wave1.expirySeconds : wave === 2 ? cfg.wave2.expirySeconds : cfg.wave3.expirySeconds;
        await enqueueWave(jobId, nextWave, expirySeconds * 1000);
    }

    return { ok: true, offers: offers.length };
}

module.exports = { processDispatch };
