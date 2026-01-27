/*
 * Copyright © 2026 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Dynamic Pricing Engine - Surge Pricing & Revenue Optimization
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Dynamic Pricing Engine - Calculates optimal prices in real-time
 * Similar to Uber's surge pricing, but for freight
 */

interface PricingFactors {
  basePrice: number;
  distance: number; // miles
  vehicleType: string;
  pickupLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
  requestedPickupTime?: Date;
  urgency?: 'standard' | 'urgent' | 'critical';
}

interface PricingResult {
  basePrice: number;
  demandMultiplier: number;
  urgencyMultiplier: number;
  distanceMultiplier: number;
  timeMultiplier: number;
  finalPrice: number;
  strategy: 'STANDARD' | 'SURGE' | 'DISCOUNT' | 'ENTERPRISE_CUSTOM';
  surgeReason?: string;
  savings?: number; // If discounted
  breakdown: {
    base: number;
    distance: number;
    demand: number;
    urgency: number;
    time: number;
  };
}

/**
 * Base pricing by vehicle type (from Phase 20)
 */
const BASE_PRICING = {
  CAR: { base: 5, per_mile: 1.5, platform_fee: 0.08 },
  VAN: { base: 8, per_mile: 2.0, platform_fee: 0.10 },
  BOX_TRUCK: { base: 15, per_mile: 3.5, platform_fee: 0.12 },
  SEMI: { base: 25, per_mile: 5.0, platform_fee: 0.15 },
};

/**
 * Calculate base price before multipliers
 */
function calculateBasePrice(vehicleType: string, distance: number): number {
  const pricing = BASE_PRICING[vehicleType as keyof typeof BASE_PRICING] || BASE_PRICING.CAR;
  return pricing.base + (distance * pricing.per_mile);
}

/**
 * Check driver availability in region (demand factor)
 */
async function calculateDemandMultiplier(
  vehicleType: string,
  pickupLocation: { lat: number; lng: number }
): Promise<{ multiplier: number; reason?: string; availableDrivers: number }> {
  // Query available drivers near pickup location
  // In real implementation, this would use PostGIS or similar
  // For now, simulate based on time and randomness
  
  const currentHour = new Date().getHours();
  const isPeakHours = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 19);
  
  // Simulate driver availability
  let availableDrivers = Math.floor(Math.random() * 20) + 5;
  
  // Peak hours reduce availability
  if (isPeakHours) {
    availableDrivers = Math.floor(availableDrivers * 0.6);
  }
  
  // Calculate multiplier based on supply/demand
  let multiplier = 1.0;
  let reason: string | undefined;
  
  if (availableDrivers < 3) {
    multiplier = 2.0;
    reason = 'low_supply';
  } else if (availableDrivers < 6) {
    multiplier = 1.5;
    reason = 'high_demand';
  } else if (availableDrivers < 10) {
    multiplier = 1.25;
    reason = 'moderate_demand';
  }
  
  return { multiplier, reason, availableDrivers };
}

/**
 * Calculate urgency multiplier
 */
function calculateUrgencyMultiplier(urgency?: string, requestedTime?: Date): number {
  if (urgency === 'critical') {
    return 1.75; // 75% premium for critical/emergency
  }
  
  if (urgency === 'urgent') {
    return 1.4; // 40% premium for urgent
  }
  
  // Check if pickup is within next 2 hours
  if (requestedTime) {
    const hoursUntilPickup = (requestedTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilPickup < 2) {
      return 1.3; // 30% premium for same-day urgent
    }
  }
  
  return 1.0; // Standard pricing
}

/**
 * Calculate distance multiplier (longer distances = better per-mile rate)
 */
function calculateDistanceMultiplier(distance: number): number {
  if (distance > 200) {
    return 0.9; // 10% discount for long haul
  } else if (distance > 100) {
    return 0.95; // 5% discount for medium distance
  } else if (distance < 10) {
    return 1.1; // 10% premium for very short trips
  }
  return 1.0;
}

/**
 * Calculate time-based multiplier (night/weekend/holiday)
 */
function calculateTimeMultiplier(requestedTime?: Date): { multiplier: number; reason?: string } {
  const time = requestedTime || new Date();
  const hour = time.getHours();
  const day = time.getDay();
  
  // Weekend
  if (day === 0 || day === 6) {
    return { multiplier: 1.2, reason: 'weekend' };
  }
  
  // Late night (10pm - 6am)
  if (hour >= 22 || hour < 6) {
    return { multiplier: 1.3, reason: 'overnight' };
  }
  
  // Early morning (6am - 8am)
  if (hour >= 6 && hour < 8) {
    return { multiplier: 1.15, reason: 'early_morning' };
  }
  
  return { multiplier: 1.0 };
}

/**
 * Check if discount should be applied (promotional, first-time user, etc.)
 */
async function checkDiscountEligibility(
  orgId?: string,
  userId?: string
): Promise<{ eligible: boolean; discount: number; reason?: string }> {
  if (!orgId && !userId) {
    return { eligible: false, discount: 0 };
  }
  
  // Check if new customer (first 3 jobs)
  if (orgId) {
    const jobCount = await prisma.job.count({
      where: { organizationId: orgId },
    });
    
    if (jobCount < 3) {
      return { eligible: true, discount: 0.15, reason: 'first_time_customer' };
    }
  }
  
  // Check for promotional campaigns
  // In real implementation, check active promotions from database
  
  return { eligible: false, discount: 0 };
}

/**
 * Main pricing function - calculates optimal price
 */
export async function calculateDynamicPrice(
  factors: PricingFactors,
  orgId?: string,
  userId?: string
): Promise<PricingResult> {
  // 1. Calculate base price
  const basePrice = calculateBasePrice(factors.vehicleType, factors.distance);
  
  // 2. Get demand multiplier
  const demandData = await calculateDemandMultiplier(factors.vehicleType, factors.pickupLocation);
  const demandMultiplier = demandData.multiplier;
  
  // 3. Calculate urgency multiplier
  const urgencyMultiplier = calculateUrgencyMultiplier(
    factors.urgency,
    factors.requestedPickupTime
  );
  
  // 4. Calculate distance multiplier
  const distanceMultiplier = calculateDistanceMultiplier(factors.distance);
  
  // 5. Calculate time multiplier
  const timeData = calculateTimeMultiplier(factors.requestedPickupTime);
  const timeMultiplier = timeData.multiplier;
  
  // 6. Check for discounts
  const discountData = await checkDiscountEligibility(orgId, userId);
  
  // 7. Calculate final price
  let finalPrice = basePrice * demandMultiplier * urgencyMultiplier * distanceMultiplier * timeMultiplier;
  
  // Apply discount if eligible
  let strategy: PricingResult['strategy'] = 'STANDARD';
  let savings: number | undefined;
  let surgeReason: string | undefined;
  
  if (discountData.eligible) {
    savings = finalPrice * discountData.discount;
    finalPrice -= savings;
    strategy = 'DISCOUNT';
  } else if (demandMultiplier > 1.3 || urgencyMultiplier > 1.3) {
    strategy = 'SURGE';
    surgeReason = demandData.reason || 'high_demand';
  }
  
  // Round to 2 decimals
  finalPrice = Math.round(finalPrice * 100) / 100;
  
  // 8. Create breakdown
  const breakdown = {
    base: basePrice,
    distance: basePrice * (distanceMultiplier - 1),
    demand: basePrice * (demandMultiplier - 1),
    urgency: basePrice * (urgencyMultiplier - 1),
    time: basePrice * (timeMultiplier - 1),
  };
  
  return {
    basePrice,
    demandMultiplier,
    urgencyMultiplier,
    distanceMultiplier,
    timeMultiplier,
    finalPrice,
    strategy,
    surgeReason,
    savings,
    breakdown,
  };
}

/**
 * Store pricing decision in database for analytics
 */
export async function storePricingDecision(
  jobId: string,
  pricingResult: PricingResult,
  availableDrivers?: number
) {
  return prisma.dynamicPricing.create({
    data: {
      jobId,
      basePrice: pricingResult.basePrice,
      demandMultiplier: pricingResult.demandMultiplier,
      urgencyMultiplier: pricingResult.urgencyMultiplier,
      distanceMultiplier: pricingResult.distanceMultiplier,
      timeMultiplier: pricingResult.timeMultiplier,
      finalPrice: pricingResult.finalPrice,
      strategy: pricingResult.strategy,
      surgeReason: pricingResult.surgeReason,
      availableDrivers: availableDrivers || null,
      aiRecommended: true,
      aiConfidence: 85, // Default confidence
      appliedAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min quote validity
    },
  });
}

/**
 * Get surge pricing statistics
 */
export async function getSurgePricingStats(days: number = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const stats = await prisma.dynamicPricing.aggregate({
    where: {
      appliedAt: { gte: since },
      strategy: 'SURGE',
    },
    _avg: {
      demandMultiplier: true,
      finalPrice: true,
    },
    _count: true,
  });
  
  const totalJobs = await prisma.dynamicPricing.count({
    where: {
      appliedAt: { gte: since },
    },
  });
  
  return {
    totalJobs,
    surgeJobs: stats._count,
    surgePercentage: totalJobs > 0 ? (stats._count / totalJobs) * 100 : 0,
    avgSurgeMultiplier: stats._avg.demandMultiplier || 1.0,
    avgSurgePrice: stats._avg.finalPrice || 0,
  };
}

/**
 * Recommend price adjustments based on historical data
 */
export async function recommendPriceAdjustments() {
  // Get last 30 days of pricing data
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const pricingData = await prisma.dynamicPricing.findMany({
    where: {
      appliedAt: { gte: thirtyDaysAgo },
    },
    select: {
      strategy: true,
      demandMultiplier: true,
      availableDrivers: true,
      appliedAt: true,
    },
  });
  
  // Analyze patterns
  const recommendations: any[] = [];
  
  // Check if we're consistently in surge mode
  const surgeCount = pricingData.filter(p => p.strategy === 'SURGE').length;
  const surgeRate = surgeCount / pricingData.length;
  
  if (surgeRate > 0.5) {
    recommendations.push({
      type: 'increase_base_price',
      reason: 'High surge frequency (>50% of jobs)',
      impact: 'Reduce surge events, increase predictable revenue',
      suggestedIncrease: 0.15, // 15%
    });
  }
  
  // Check if we have excess capacity
  const avgDrivers = pricingData.reduce((sum, p) => sum + (p.availableDrivers || 0), 0) / pricingData.length;
  
  if (avgDrivers > 15) {
    recommendations.push({
      type: 'run_discount_campaign',
      reason: 'High driver availability, low utilization',
      impact: 'Increase job volume, improve driver retention',
      suggestedDiscount: 0.10, // 10% off
    });
  }
  
  return recommendations;
}

export default {
  calculateDynamicPrice,
  storePricingDecision,
  getSurgePricingStats,
  recommendPriceAdjustments,
};
