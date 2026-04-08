import { prisma } from "../db/prisma.js";

export interface PricingRecommendation {
  loadId: string;
  recommendedRateCents: number;
  acceptanceProbability: number;
  confidence: number;
  factorBreakdown: Record<string, number>;
  reasonCodes: string[];
}

/**
 * Smart Pricing Engine
 * Calculates optimal rate per load using deterministic multi-factor algorithm
 * Inputs: lane history, urgency, distance, carrier availability, demand, risk, complexity
 * Output: recommended rate + acceptance probability + confidence
 */
export class SmartPricingService {
  /**
   * Recommend pricing for a load
   */
  async recommendPricing(tenantId: string, loadId: string): Promise<PricingRecommendation> {
    // Fetch load
    const load = await prisma.load.findUnique({
      where: { id: loadId },
    });

    if (!load || load.tenantId !== tenantId) {
      throw new Error("Load not found or access denied");
    }

    // Calculate pricing factors
    const factors = await this.calculatePricingFactors(tenantId, load);

    // Calculate base rate
    const baseRate = this.calculateBaseRate(load);

    // Apply multipliers
    let adjustedRate = baseRate;
    adjustedRate *= factors.demandMultiplier;
    adjustedRate *= factors.riskMultiplier;
    adjustedRate *= factors.urgencyMultiplier;
    adjustedRate *= factors.complexityMultiplier;
    adjustedRate *= factors.carrierAvailabilityMultiplier;

    // Round to nearest cent
    const recommendedRateCents = Math.round(adjustedRate);

    // Calculate acceptance probability
    const acceptanceProbability = this.calculateAcceptanceProbability(
      recommendedRateCents,
      baseRate,
      factors,
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(factors, acceptanceProbability);

    // Generate reason codes
    const reasonCodes = this.generatePricingReasonCodes(factors, acceptanceProbability);

    // Save pricing snapshot
    await prisma.pricingSnapshot.create({
      data: {
        tenantId,
        loadId,
        recommendedRateCents,
        acceptanceProbability,
        confidence,
        factors,
      },
    });

    // Log the decision
    await this.logPricingDecision(
      tenantId,
      loadId,
      recommendedRateCents,
      confidence,
      reasonCodes,
      factors,
    );

    return {
      loadId,
      recommendedRateCents,
      acceptanceProbability,
      confidence,
      factorBreakdown: factors,
      reasonCodes,
    };
  }

  /**
   * Get pricing history for a load
   */
  async getPricingHistory(tenantId: string, loadId: string): Promise<PricingRecommendation[]> {
    const snapshots = await prisma.pricingSnapshot.findMany({
      where: {
        tenantId,
        loadId,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return snapshots.map((snap: any) => ({
      loadId,
      recommendedRateCents: snap.recommendedRateCents,
      acceptanceProbability: snap.acceptanceProbability || 0,
      confidence: snap.confidence || 0,
      factorBreakdown: (snap.factors as Record<string, number>) || {},
      reasonCodes: [],
    }));
  }

  /**
   * Calculate pricing factors
   */
  private async calculatePricingFactors(
    tenantId: string,
    load: any,
  ): Promise<Record<string, number>> {
    // Lane history multiplier (0.8-1.2)
    // High supply on lane = lower multiplier, high demand = higher multiplier
    const laneHistoryMultiplier = await this.calculateLaneHistoryMultiplier(
      tenantId,
      load.originState,
      load.destState,
    );

    // Urgency multiplier (0.9-1.5)
    // Same-day/next-day = higher, standard = lower
    const urgencyMultiplier = this.calculateUrgencyMultiplier(load);

    // Distance multiplier (0.8-1.3)
    // Longer distance = higher rate per mile
    const distanceMultiplier = this.calculateDistanceMultiplier(load.distanceMi);

    // Carrier availability multiplier (0.9-1.4)
    // Few available carriers = higher multiplier
    const carrierAvailabilityMultiplier =
      await this.calculateCarrierAvailabilityMultiplier(tenantId);

    // Demand multiplier (0.7-1.5)
    // High demand periods = higher multiplier
    const demandMultiplier = this.calculateDemandMultiplier();

    // Risk multiplier (0.8-1.3)
    // High-risk lanes or loads = higher multiplier
    const riskMultiplier = this.calculateRiskMultiplier(load);

    // Complexity multiplier (1.0-1.4)
    // Complex loads (hazmat, oversized) = higher multiplier
    const complexityMultiplier = this.calculateComplexityMultiplier(load);

    return {
      laneHistoryMultiplier,
      urgencyMultiplier,
      distanceMultiplier,
      carrierAvailabilityMultiplier,
      demandMultiplier,
      riskMultiplier,
      complexityMultiplier,
    };
  }

  /**
   * Calculate base rate from distance and weight
   * Formula: $1.50/mile + $0.05/lb
   */
  private calculateBaseRate(load: any): number {
    const perMileRate = 1.5;
    const perLbRate = 0.05;
    return load.distanceMi * perMileRate + load.weightLb * perLbRate;
  }

  /**
   * Lane history multiplier
   */
  private async calculateLaneHistoryMultiplier(
    tenantId: string,
    originState: string,
    destState: string,
  ): Promise<number> {
    // Placeholder: would query historical lane data
    // For now, return neutral multiplier
    return 1.0;
  }

  /**
   * Urgency multiplier
   */
  private calculateUrgencyMultiplier(load: any): number {
    // Placeholder: would check load urgency field
    // For now, return neutral
    return 1.0;
  }

  /**
   * Distance multiplier
   * Longer distance = higher multiplier (economy of scale)
   */
  private calculateDistanceMultiplier(distanceMi: number): number {
    if (distanceMi < 100) return 1.2; // Short haul premium
    if (distanceMi < 300) return 1.0; // Standard
    if (distanceMi < 800) return 0.95; // Medium haul discount
    return 0.9; // Long haul discount
  }

  /**
   * Carrier availability multiplier
   */
  private async calculateCarrierAvailabilityMultiplier(tenantId: string): Promise<number> {
    const availableCount = await prisma.driver.count({
      where: {
        tenantId,
        status: "AVAILABLE",
      },
    });

    if (availableCount < 3) return 1.3; // Few available = premium
    if (availableCount < 10) return 1.1;
    return 0.95; // Many available = discount
  }

  /**
   * Demand multiplier
   */
  private calculateDemandMultiplier(): number {
    // Placeholder: would check current market demand
    // For now, return neutral
    return 1.0;
  }

  /**
   * Risk multiplier
   */
  private calculateRiskMultiplier(load: any): number {
    // Placeholder: would check load risk factors (hazmat, oversized, etc.)
    // For now, return neutral
    return 1.0;
  }

  /**
   * Complexity multiplier
   */
  private calculateComplexityMultiplier(load: any): number {
    // Placeholder: would check complexity flags
    // For now, return neutral
    return 1.0;
  }

  /**
   * Calculate acceptance probability (0-1)
   * Higher rate = lower acceptance probability
   */
  private calculateAcceptanceProbability(
    recommendedRate: number,
    baseRate: number,
    factors: Record<string, number>,
  ): number {
    // If rate is at or below base rate, high acceptance
    if (recommendedRate <= baseRate) {
      return 0.95;
    }

    // For each 10% above base rate, reduce acceptance by 10%
    const percentAboveBase = (recommendedRate - baseRate) / baseRate;
    const acceptanceProbability = Math.max(0.3, 0.95 - percentAboveBase * 0.5);

    return Math.round(acceptanceProbability * 100) / 100;
  }

  /**
   * Calculate confidence (0-1)
   */
  private calculateConfidence(
    factors: Record<string, number>,
    acceptanceProbability: number,
  ): number {
    // Confidence based on acceptance probability
    // High acceptance = high confidence, low acceptance = lower confidence
    const baseConfidence = 0.7 + acceptanceProbability * 0.2;
    return Math.min(1.0, baseConfidence);
  }

  /**
   * Generate reason codes
   */
  private generatePricingReasonCodes(
    factors: Record<string, number>,
    acceptanceProbability: number,
  ): string[] {
    const codes: string[] = [];

    if (factors.demandMultiplier > 1.2) codes.push("HIGH_DEMAND_PREMIUM");
    if (factors.urgencyMultiplier > 1.2) codes.push("URGENT_LOAD_PREMIUM");
    if (factors.complexityMultiplier > 1.2) codes.push("COMPLEX_LOAD_PREMIUM");
    if (factors.carrierAvailabilityMultiplier > 1.2) codes.push("LIMITED_AVAILABILITY_PREMIUM");
    if (acceptanceProbability < 0.5) codes.push("COMPETITIVE_MARKET_WARNING");

    return codes.length > 0 ? codes : ["MARKET_RATE"];
  }

  /**
   * Log pricing decision
   */
  private async logPricingDecision(
    tenantId: string,
    loadId: string,
    recommendedRate: number,
    confidence: number,
    reasonCodes: string[],
    factors: Record<string, number>,
  ): Promise<void> {
    await prisma.aiDecisionLog.create({
      data: {
        tenantId,
        entityType: "LOAD",
        entityId: loadId,
        module: "SMART_PRICING",
        decision: `Recommended rate: $${(recommendedRate / 100).toFixed(2)}`,
        confidence,
        reasonCodes,
        inputSnapshot: factors,
        outputSnapshot: { recommendedRate, confidence },
      },
    });
  }
}

export const smartPricingService = new SmartPricingService();
