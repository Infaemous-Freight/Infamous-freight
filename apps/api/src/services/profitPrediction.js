/*
 * Lightweight route profit prediction heuristics.
 */

const MAX_DISTANCE_MILES = 5000;
const MAX_RATE_PER_MILE = 20;
const MAX_FUEL_PRICE = 15;
const MAX_MPG = 15;
const MIN_MPG = 3;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function haversineMiles(origin, destination) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8;

  const dLat = toRad(destination.lat - origin.lat);
  const dLon = toRad(destination.lng - origin.lng);
  const lat1 = toRad(origin.lat);
  const lat2 = toRad(destination.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLon / 2) ** 2);

  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Predict trip profit from route and economic heuristics.
 */
function predictProfit(input = {}) {
  const {
    origin,
    destination,
    distanceMiles,
    ratePerMile = 2.75,
    mpg = 8,
    fuelPricePerGallon = 4.25,
    baseCost = 125,
    driverCostPerMile = 0.62,
    maintenanceCostPerMile = 0.18,
  } = input;

  const hasCoordinates =
    origin &&
    destination &&
    Number.isFinite(origin.lat) &&
    Number.isFinite(origin.lng) &&
    Number.isFinite(destination.lat) &&
    Number.isFinite(destination.lng);

  if (!Number.isFinite(distanceMiles) && !hasCoordinates) {
    return null;
  }

  const safeDistance = clamp(
    Number.isFinite(distanceMiles) ? distanceMiles : haversineMiles(origin, destination),
    1,
    MAX_DISTANCE_MILES,
  );

  const safeMpg = clamp(Number.isFinite(mpg) && mpg > 0 ? mpg : MIN_MPG, MIN_MPG, MAX_MPG);
  const safeRatePerMile = clamp(
    Number.isFinite(ratePerMile) ? ratePerMile : 0,
    0,
    MAX_RATE_PER_MILE,
  );
  const safeFuelPrice = clamp(
    Number.isFinite(fuelPricePerGallon) ? fuelPricePerGallon : 0,
    0,
    MAX_FUEL_PRICE,
  );

  const grossRevenue = safeDistance * safeRatePerMile;
  const fuelCost = (safeDistance / safeMpg) * safeFuelPrice;
  const driverCost = safeDistance * Math.max(0, driverCostPerMile);
  const maintenanceCost = safeDistance * Math.max(0, maintenanceCostPerMile);
  const totalCost = Math.max(0, baseCost) + fuelCost + driverCost + maintenanceCost;
  const netProfit = grossRevenue - totalCost;

  return {
    distanceMiles: roundCurrency(safeDistance),
    grossRevenue: roundCurrency(grossRevenue),
    totalCost: roundCurrency(totalCost),
    netProfit: roundCurrency(netProfit),
    profitMarginPct: grossRevenue > 0 ? roundCurrency((netProfit / grossRevenue) * 100) : 0,
    assumptions: {
      mpg: safeMpg,
      fuelPricePerGallon: safeFuelPrice,
      ratePerMile: safeRatePerMile,
    },
  };
}

module.exports = {
  predictProfit,
};
