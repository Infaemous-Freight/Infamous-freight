/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: AI Profit Prediction Service
 */

const DEFAULTS = {
    baseRatePerMile: 2.25,
    fuelPricePerGallon: 4.25,
    mpg: 6.5,
    maintenancePerMile: 0.35,
    insurancePerMile: 0.12,
    handlingFee: 75,
    estimatedDistanceMiles: 300,
};

function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function milesBetween(origin, destination) {
    if (!origin || !destination) return null;
    if (
        typeof origin !== 'object' ||
        typeof destination !== 'object' ||
        origin.lat === undefined ||
        origin.lng === undefined ||
        destination.lat === undefined ||
        destination.lng === undefined
    ) {
        return null;
    }

    const lat1 = Number(origin.lat);
    const lon1 = Number(origin.lng);
    const lat2 = Number(destination.lat);
    const lon2 = Number(destination.lng);
    if (
        !Number.isFinite(lat1) ||
        !Number.isFinite(lon1) ||
        !Number.isFinite(lat2) ||
        !Number.isFinite(lon2)
    ) {
        return null;
    }

    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function buildAssumptions({
    distanceMiles,
    ratePerMile,
    fuelPricePerGallon,
    mpg,
    maintenancePerMile,
    insurancePerMile,
    handlingFee,
}) {
    return {
        distanceMiles,
        ratePerMile,
        fuelPricePerGallon,
        mpg,
        maintenancePerMile,
        insurancePerMile,
        handlingFee,
    };
}

function predictProfit(input) {
    const distanceMiles =
        toNumber(input.distanceMiles) ??
        milesBetween(input.origin, input.destination) ??
        DEFAULTS.estimatedDistanceMiles;
    const weight = toNumber(input.weight) ?? 0;
    const fuelPricePerGallon =
        toNumber(input.fuelPricePerGallon) ?? DEFAULTS.fuelPricePerGallon;
    const mpg = toNumber(input.mpg) ?? DEFAULTS.mpg;
    const maintenancePerMile =
        toNumber(input.maintenancePerMile) ?? DEFAULTS.maintenancePerMile;
    const insurancePerMile =
        toNumber(input.insurancePerMile) ?? DEFAULTS.insurancePerMile;
    const handlingFee = toNumber(input.handlingFee) ?? DEFAULTS.handlingFee;
    const baseRatePerMile =
        toNumber(input.baseRatePerMile) ?? DEFAULTS.baseRatePerMile;

    const weightFactor = clamp(weight / 10000, 0.85, 1.25);
    const ratePerMile = clamp(
        toNumber(input.ratePerMile) ?? baseRatePerMile * weightFactor,
        1.25,
        6.5,
    );

    const fuelCostPerMile = fuelPricePerGallon / mpg;
    const variableCostPerMile =
        fuelCostPerMile + maintenancePerMile + insurancePerMile;

    const revenue = distanceMiles * ratePerMile;
    const variableCost = distanceMiles * variableCostPerMile;
    const totalCost = variableCost + handlingFee;
    const predictedProfit = revenue - totalCost;

    const confidence =
        input.distanceMiles || milesBetween(input.origin, input.destination)
            ? 0.78
            : 0.62;

    return {
        predictedProfit: Number(predictedProfit.toFixed(2)),
        revenue: Number(revenue.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        variableCost: Number(variableCost.toFixed(2)),
        distanceMiles: Number(distanceMiles.toFixed(2)),
        ratePerMile: Number(ratePerMile.toFixed(2)),
        confidence,
        assumptions: buildAssumptions({
            distanceMiles: Number(distanceMiles.toFixed(2)),
            ratePerMile: Number(ratePerMile.toFixed(2)),
            fuelPricePerGallon: Number(fuelPricePerGallon.toFixed(2)),
            mpg: Number(mpg.toFixed(2)),
            maintenancePerMile: Number(maintenancePerMile.toFixed(2)),
            insurancePerMile: Number(insurancePerMile.toFixed(2)),
            handlingFee: Number(handlingFee.toFixed(2)),
        }),
        modelVersion: 'v1.0.0',
    };
}

module.exports = {
    predictProfit,
};
