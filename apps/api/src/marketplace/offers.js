/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Marketplace Offers & Eligible Driver Selection (Phase 10+)
 *
 * Phase 13 upgrade: ETA-to-pickup ranking via Mapbox Matrix API
 */

const { PrismaClient } = require("@prisma/client");
const { milesBetween } = require("../lib/geo");
const { etaToPickupSeconds } = require("../mapbox/eta");
let redis;
try {
    // Optional Redis cache for ETA results (Phase 15)
    const { redisConnection } = require("../queue/redis");
    redis = redisConnection();
} catch (_) {
    redis = null;
}

const prisma = new PrismaClient();

function envNum(name, def) {
    const n = Number(process.env[name]);
    return Number.isFinite(n) ? n : def;
}

function envBool(name, def = false) {
    const v = process.env[name];
    if (v == null) return def;
    return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

async function getEligibleDriversForJob(params) {
    const { jobId, radiusMiles, limit, excludeDriverIds = [] } = params;
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new Error("Job not found");

    const drivers = await prisma.user.findMany({
        where: {
            role: "DRIVER",
            driverProfile: {
                isActive: true,
                lastLat: { not: null },
                lastLng: { not: null },
            },
        },
        include: { driverProfile: true, vehicles: true },
        take: 1000,
    });

    const exclude = new Set(excludeDriverIds);

    // Phase 13: Pre-filter by distance and vehicle compatibility
    const preFiltered = drivers
        .map((d) => {
            const dp = d.driverProfile;
            if (!dp || dp.lastLat == null || dp.lastLng == null) return null;
            if (exclude.has(d.id)) return null;

            const dist = milesBetween(dp.lastLat, dp.lastLng, job.pickupLat, job.pickupLng);
            const okVehicle = (d.vehicles || []).some((v) =>
                v.type === job.requiredVehicle &&
                v.maxWeightLbs >= job.weightLbs &&
                v.maxVolumeCuFt >= job.volumeCuFt
            );

            if (!okVehicle) return null;

            return {
                driver: d,
                distanceMiles: Number(dist.toFixed(2)),
                etaSeconds: null, // Will be filled by Mapbox
            };
        })
        .filter(Boolean)
        .filter((x) => x.distanceMiles <= radiusMiles)
        .sort((a, b) => a.distanceMiles - b.distanceMiles);

    // Phase 13: Optionally rank by ETA instead of distance
    const useEtaRanking = envBool("MAPBOX_USE_ETA_RANKING", true);
    const maxEtaCandidates = envNum("MAPBOX_ETA_MAX_CANDIDATES", 50);
    const mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;

    if (useEtaRanking && mapboxAccessToken && preFiltered.length > 0) {
        try {
            // Cap to avoid excessive Mapbox calls
            const candidates = preFiltered.slice(0, Math.min(maxEtaCandidates, preFiltered.length));

            // Try use Redis precomputed ETAs first
            let etaMap = null;
            if (redis) {
                try {
                    const raw = await redis.get(`eta:job:${jobId}`);
                    if (raw) etaMap = JSON.parse(raw);
                } catch (_) { }
            }

            // Batch call to Mapbox Matrix
            let etas;
            if (etaMap) {
                etas = candidates.map((c) => etaMap[c.driver.id] ?? null);
            }
            if (!etas || etas.some((v) => v == null)) {
                etas = await etaToPickupSeconds({
                    pickup: { lat: job.pickupLat, lng: job.pickupLng },
                    drivers: candidates.map((c) => ({
                        lat: c.driver.driverProfile.lastLat,
                        lng: c.driver.driverProfile.lastLng,
                    })),
                });
            }

            // Attach ETAs to candidates
            candidates.forEach((candidate, idx) => {
                candidate.etaSeconds = etas[idx];
            });

            // Re-sort by ETA (ascending)
            candidates.sort((a, b) => (a.etaSeconds || 0) - (b.etaSeconds || 0));

            // Take top N and assign ranks
            const eligible = candidates
                .slice(0, limit)
                .map((x, idx) => ({ ...x, rank: idx + 1 }));

            return { job, eligible };
        } catch (err) {
            // Fallback to distance ranking if Mapbox fails
            console.error("Mapbox ETA lookup failed, falling back to distance ranking:", err.message);
            const eligible = preFiltered
                .slice(0, limit)
                .map((x, idx) => ({ ...x, rank: idx + 1 }));
            return { job, eligible };
        }
    }

    // Phase 10 fallback: distance-only ranking
    const eligible = preFiltered
        .slice(0, limit)
        .map((x, idx) => ({ ...x, rank: idx + 1 }));

    return { job, eligible };
}

async function expireOffersForJob(jobId) {
    const now = new Date();
    return prisma.jobOffer.updateMany({
        where: { jobId, status: "OFFERED", expiresAt: { lt: now } },
        data: { status: "EXPIRED" },
    });
}

module.exports = {
    getEligibleDriversForJob,
    expireOffersForJob,
};
