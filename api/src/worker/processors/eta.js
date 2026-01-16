const { PrismaClient } = require("@prisma/client");
const { etaToPickupSeconds } = require("../../mapbox/eta");
const { redisConnection } = require("../../queue/redis");

const prisma = new PrismaClient();
const redis = redisConnection();

async function processEta(job) {
    const { jobId, candidateDriverIds } = job.data;
    const j = await prisma.job.findUnique({ where: { id: jobId }, select: { pickupLat: true, pickupLng: true } });
    if (!j) return { skipped: true, reason: "JOB_NOT_FOUND" };

    const drivers = await prisma.user.findMany({
        where: { id: { in: candidateDriverIds }, driverProfile: { isActive: true } },
        select: { id: true, driverProfile: { select: { lastLat: true, lastLng: true } } },
    });

    const coords = drivers.map((d) => ({ lat: d.driverProfile.lastLat, lng: d.driverProfile.lastLng }));
    const etas = await etaToPickupSeconds({ pickup: { lat: j.pickupLat, lng: j.pickupLng }, drivers: coords });

    const map = {};
    for (let i = 0; i < drivers.length; i++) {
        map[drivers[i].id] = etas[i];
    }

    const ttl = Number(process.env.MAPBOX_ETA_CACHE_TTL_SECONDS || "30");
    await redis.set(`eta:job:${jobId}`, JSON.stringify(map), "EX", ttl);
    return { ok: true, count: drivers.length };
}

module.exports = { processEta };
