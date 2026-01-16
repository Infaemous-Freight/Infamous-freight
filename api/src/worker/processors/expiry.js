const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function processExpireOffers(job) {
    const now = new Date();
    if (job.data && job.data.scope === "job" && job.data.jobId) {
        const res = await prisma.jobOffer.updateMany({
            where: { jobId: job.data.jobId, status: "OFFERED", expiresAt: { lt: now } },
            data: { status: "EXPIRED" },
        });
        return { updated: res.count };
    }
    const res = await prisma.jobOffer.updateMany({ where: { status: "OFFERED", expiresAt: { lt: now } }, data: { status: "EXPIRED" } });
    return { updated: res.count };
}

async function processExpireHolds(job) {
    const now = new Date();
    const expired = await prisma.job.findMany({ where: { status: "HELD", heldUntil: { lt: now } }, select: { id: true } });
    let updated = 0;
    for (const j of expired) {
        await prisma.$transaction(async (tx) => {
            await tx.job.update({ where: { id: j.id }, data: { status: "OPEN", heldByDriverId: null, heldUntil: null } });
            await tx.jobEvent.create({ data: { jobId: j.id, type: "NOTE", actorUserId: null, message: "Hold expired; job reopened" } });
        });
        updated++;
    }
    return { updated };
}

module.exports = { processExpireOffers, processExpireHolds };
