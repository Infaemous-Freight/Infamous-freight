/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Mapbox ETA Service (Phase 13)
 *
 * Computes ETA-to-pickup using Mapbox Matrix API with:
 * - Batching (respects 25-coordinate limit for mapbox/driving)
 * - In-memory caching with TTL
 * - Asymmetric matrix: drivers (sources) → pickup (destination)
 */

const { TinyTTLCache } = require("../lib/cache");
const { cacheGetJson, cacheSetJson } = require("../lib/redisCache");

function envNum(name, def) {
    const n = Number(process.env[name]);
    return Number.isFinite(n) ? n : def;
}

function envRequired(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
}

/**
 * Create cache instance with configured TTL
 */
const ttlSeconds = envNum("MAPBOX_ETA_CACHE_TTL_SECONDS", 30);
const cache = new TinyTTLCache(ttlSeconds * 1000);

/**
 * Generate cache key from pickup + driver locations
 * Uses coarse rounding (0.01 precision ≈ 1km) for better cache hit rate
 */
function makeCacheKey(pickup, drivers) {
    const round = (v) => Math.round(v * 100) / 100; // 0.01 precision
    const pickupStr = `${round(pickup.lat)},${round(pickup.lng)}`;
    const driverStrs = drivers.map((d) => `${round(d.lat)},${round(d.lng)}`).join("|");
    return `eta:${pickupStr}:${driverStrs}`;
}

/**
 * Call Mapbox Matrix API for a batch of drivers → pickup
 * Returns array of ETAs in seconds, one per driver
 */
async function callMatrix(token, profile, pickup, drivers) {
    // Mapbox expects coordinates as lon,lat (opposite of our convention)
    const coords = [
        ...drivers.map((d) => `${d.lng},${d.lat}`),
        `${pickup.lng},${pickup.lat}`,
    ].join(";");

    // sources = driver indices 0..N-1, destination = pickup at index N
    const destIndex = drivers.length;
    const sources = drivers.map((_, idx) => String(idx)).join(";");
    const destinations = String(destIndex);

    // Request only durations (cheaper than both)
    const url = new URL("https://api.mapbox.com/directions-matrix/v1/${profile}/${coords}");
    url.searchParams.set("sources", sources);
    url.searchParams.set("destinations", destinations);
    url.searchParams.set("access_token", token);

    const res = await fetch(url.toString());
    if (!res.ok) {
        const text = await res.text();
        throw new Error(
            `Mapbox Matrix API error: HTTP ${res.status} ${text.slice(0, 100)}`
        );
    }

    const data = await res.json();
    if (data.code !== "Ok") {
        throw new Error(`Mapbox Matrix error: ${data.code} ${data.message || ""}`);
    }

    // Extract durations from the asymmetric matrix
    // Each row i is driver i, column 0 is the pickup destination
    const durations = data.durations.map((row) => row[0]);
    return durations;
}

/**
 * Compute ETAs from multiple drivers to a single pickup location
 * @param {Object} params
 * @param {Object} params.pickup - { lat: number, lng: number }
 * @param {Array} params.drivers - [{ lat, lng }, ...]
 * @returns {Promise<number[]>} - ETAs in seconds, indexed by driver order
 */
async function etaToPickupSeconds(params) {
    const { pickup, drivers } = params;

    if (!drivers.length) return [];
    if (!pickup || pickup.lat == null || pickup.lng == null) {
        throw new Error("Invalid pickup coordinates");
    }

    // Check caches (prefer shared Redis, then local)
    const cacheKey = makeCacheKey(pickup, drivers);
    const redisCached = await cacheGetJson(cacheKey);
    if (redisCached && Array.isArray(redisCached)) {
        return redisCached;
    }

    const localCached = cache.get(cacheKey);
    if (localCached) {
        return localCached;
    }

    const token = envRequired("MAPBOX_ACCESS_TOKEN");
    const profile = process.env.MAPBOX_MATRIX_PROFILE || "mapbox/driving";

    // Batch to respect coordinate limits
    // mapbox/driving: max 25 total coords → max 24 drivers per request
    // mapbox/driving-traffic: max 10 total coords → max 9 drivers per request
    const maxCoords = profile === "mapbox/driving-traffic" ? 10 : 25;
    const maxDriversPerReq = Math.max(1, maxCoords - 1);

    const allEtas = [];

    for (let i = 0; i < drivers.length; i += maxDriversPerReq) {
        const chunk = drivers.slice(i, i + maxDriversPerReq);
        const etas = await callMatrix(token, profile, pickup, chunk);
        allEtas.push(...etas);
    }

    // Cache result in Redis (shared) and local fallback
    try {
        await cacheSetJson(cacheKey, allEtas, ttlSeconds);
    } catch (_) { }
    cache.set(cacheKey, allEtas);

    return allEtas;
}

/**
 * Get ETA in seconds for a single driver to pickup
 */
async function getEtaSeconds(driverLat, driverLng, pickupLat, pickupLng) {
    const etas = await etaToPickupSeconds({
        pickup: { lat: pickupLat, lng: pickupLng },
        drivers: [{ lat: driverLat, lng: driverLng }],
    });
    return etas[0];
}

module.exports = {
    etaToPickupSeconds,
    getEtaSeconds,
    cache, // Export for testing/diagnostics
};
