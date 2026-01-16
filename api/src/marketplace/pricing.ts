/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Marketplace Pricing Calculator
 */

/**
 * Compute delivery price based on vehicle type, distance, and shipper plan.
 * 
 * Base rates by vehicle (minimum charge):
 * - CAR: $8.00
 * - SUV: $12.00
 * - VAN: $18.00
 * - BOX_TRUCK: $45.00
 * - STRAIGHT_TRUCK: $70.00
 * - SEMI: $120.00
 * 
 * Distance-based pricing: $1.50 per mile
 * Plan discounts: STARTER -10%, PRO -15%, ENTERPRISE -20%
 * 
 * Minimum charge: base rate for vehicle type
 */
function computePriceUsd(input) {
  const {
    requiredVehicle,
    estimatedMiles = 0,
    shipperPlanTier = "FREE",
    weightLbs = 0,
    volumeCuFt = 0,
  } = input;

  // Base rates by vehicle type (minimum charge)
  const baseByVehicle = {
    CAR: 8,
    SUV: 12,
    VAN: 18,
    BOX_TRUCK: 45,
    STRAIGHT_TRUCK: 70,
    SEMI: 120,
  };

  const base = baseByVehicle[requiredVehicle] ?? 25;

  // Distance-based fee: $1.50 per mile
  const distanceFee = estimatedMiles * 1.5;

  // Light surcharges for heavy/large cargo
  const weightFee = Math.max(0, weightLbs - 200) * 0.01; // $0.01 per lb over 200
  const volumeFee = Math.max(0, volumeCuFt - 50) * 0.1; // $0.10 per cu ft over 50

  // Base subtotal before discounts
  const subtotal = base + distanceFee + weightFee + volumeFee;

  // Apply plan-based discount
  const discountsByPlan = {
    FREE: 0,
    STARTER: 0.1, // 10% off
    PRO: 0.15, // 15% off
    ENTERPRISE: 0.2, // 20% off
  };

  const discount = discountsByPlan[shipperPlanTier] || 0;
  const finalPrice = subtotal * (1 - discount);

  // Enforce minimum (base rate) and round to nearest cent
  return Math.max(base, Math.round(finalPrice * 100) / 100);
}

module.exports = { computePriceUsd };
