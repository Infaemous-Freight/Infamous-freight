/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: POD Policy Engine (Phase 12)
 *
 * Enforces Proof-of-Delivery requirements automatically based on:
 * - Job value (price)
 * - Vehicle type
 * - Optional toggles
 */

function envBool(name, def = false) {
    const v = process.env[name];
    if (v == null) return def;
    return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

function envNum(name, def = 0) {
    const n = Number(process.env[name]);
    return Number.isFinite(n) ? n : def;
}

function envList(name) {
    const v = process.env[name];
    if (!v) return [];
    return v.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Compute POD policy for a job based on price and vehicle type
 * @param {Object} input - { priceUsd: number, requiredVehicle: string }
 * @returns {Object} - { requirePhoto, requireSignature, requireOtp, version }
 */
function computePodPolicy(input) {
    const { priceUsd, requiredVehicle } = input;

    // Always require photo toggle
    const requirePhotoAlways = envBool("POD_REQUIRE_PHOTO_ALWAYS", true);

    // Thresholds by value
    const signatureMin = envNum("POD_SIGNATURE_MIN_USD", 25);
    const otpMin = envNum("POD_OTP_MIN_USD", 50);

    // Vehicle type requirements
    const otpVehicles = new Set(envList("POD_OTP_VEHICLES"));
    const photoVehicles = new Set(envList("POD_PHOTO_VEHICLES"));
    const signatureVehicles = new Set(envList("POD_SIGNATURE_VEHICLES"));

    // Compute requirements
    const requireOtp = priceUsd >= otpMin || otpVehicles.has(requiredVehicle);
    const requireSignature = priceUsd >= signatureMin || signatureVehicles.has(requiredVehicle);
    const requirePhoto = requirePhotoAlways || photoVehicles.has(requiredVehicle);

    return {
        requirePhoto,
        requireSignature,
        requireOtp,
        version: 1,
    };
}

module.exports = {
    computePodPolicy,
};
