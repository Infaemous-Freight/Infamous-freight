/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Pricing Calculator with Plan Discounts
 */

/**
 * @typedef {Object} QuoteInput
 * @property {number} estimatedMiles - Estimated delivery distance in miles
 * @property {number} estimatedMinutes - Estimated delivery time in minutes
 * @property {"FREE"|"STARTER"|"PRO"|"ENTERPRISE"} [shipperPlanTier] - Shipper's subscription tier
 */

/**
 * Parse environment variable as number with fallback
 */
const n = (v, fallback) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
};

/**
 * Get discount percentage for plan tier
 * @param {string} tier - Plan tier
 * @returns {number} Discount percentage (0-100)
 */
function discountPctForTier(tier) {
  if (tier === "STARTER") return n(process.env.DISCOUNT_STARTER_PCT, 10);
  if (tier === "PRO") return n(process.env.DISCOUNT_PRO_PCT, 20);
  if (tier === "ENTERPRISE") return n(process.env.DISCOUNT_ENTERPRISE_PCT, 30);
  return 0;
}

/**
 * Compute delivery price with plan-based discounts
 * @param {QuoteInput} input - Pricing inputs
 * @returns {number} Price in USD
 */
function computePriceUsd(input) {
  const base = n(process.env.PRICE_BASE_USD, 6.0);
  const perMile = n(process.env.PRICE_PER_MILE_USD, 1.85);
  const perMinute = n(process.env.PRICE_PER_MINUTE_USD, 0.2);
  const min = n(process.env.PRICE_MINIMUM_USD, 9.99);

  const raw = base + input.estimatedMiles * perMile + input.estimatedMinutes * perMinute;

  const discountPct = discountPctForTier(input.shipperPlanTier);
  const discounted = raw * (1 - discountPct / 100);

  const rounded = Math.round(discounted * 100) / 100;
  return Math.max(min, rounded);
}

module.exports = { computePriceUsd };
