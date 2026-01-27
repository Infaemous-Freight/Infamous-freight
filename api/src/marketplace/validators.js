/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Marketplace Request Validators
 */

const { z } = require("zod");

const vehicleType = z.enum([
    "CAR",
    "SUV",
    "VAN",
    "BOX_TRUCK",
    "STRAIGHT_TRUCK",
    "SEMI",
]);

const planTier = z.enum(["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"]);

const createJobSchema = z.object({
    shipperId: z.string().min(1),

    pickupAddress: z.string().min(5),
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),

    dropoffAddress: z.string().min(5),
    dropoffLat: z.number().min(-90).max(90),
    dropoffLng: z.number().min(-180).max(180),

    requiredVehicle: vehicleType,
    weightLbs: z.number().int().min(1).max(80000),
    volumeCuFt: z.number().int().min(1).max(4000),

    notes: z.string().max(2000).optional(),

    // MVP: UI passes estimates; later compute via Maps API
    estimatedMiles: z.number().min(0.1).max(5000),
    estimatedMinutes: z.number().int().min(1).max(200000),
});

const updateDriverLocationSchema = z.object({
    userId: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
});

const addVehicleSchema = z.object({
    userId: z.string().min(1),
    type: vehicleType,
    nickname: z.string().max(60).optional(),
    maxWeightLbs: z.number().int().min(1).max(80000),
    maxVolumeCuFt: z.number().int().min(1).max(4000),
});

const acceptJobSchema = z.object({
    jobId: z.string().min(1),
    driverUserId: z.string().min(1),
});

const holdJobSchema = z.object({
    driverUserId: z.string().min(1),
});

const subscribeSchema = z.object({
    userId: z.string().min(1),
    tier: z.enum(["STARTER", "GROWTH", "PRO", "ENTERPRISE"]),
});

const podSubmitSchema = z.object({
    driverUserId: z.string().min(1),
    otp: z.string().optional(), // required if job.otpRequired=true
    signatureName: z.string().min(1).optional(),
    signatureKey: z.string().min(1).optional(),
    photoKey: z.string().min(1).optional(),
    notes: z.string().optional(),
});

const fanoutOffersSchema = z.object({
    radiusMiles: z.number().positive().optional(),
    count: z.number().int().positive().max(50).optional(),
    wave: z.number().int().positive().optional(),
});

const acceptOfferSchema = z.object({
    driverUserId: z.string().min(1),
});

module.exports = {
    vehicleType,
    planTier,
    createJobSchema,
    updateDriverLocationSchema,
    addVehicleSchema,
    acceptJobSchema,
    podSubmitSchema,
    fanoutOffersSchema,
    acceptOfferSchema,
    holdJobSchema,
    subscribeSchema,
};
