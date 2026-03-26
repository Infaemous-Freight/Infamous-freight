import { prisma } from '../db/prisma';
import { AiDecisionLog } from '@prisma/client';

export interface DispatchRecommendation {
  recommendedDriverId: string;
  score: number;
  confidence: number;
  reasonCodes: string[];
  ranking: Array<{
    driverId: string;
    score: number;
    factors: Record<string, number>;
  }>;
}

export interface DispatchExecutionResult {
  dispatchId: string;
  loadId: string;
  driverId: string;
  status: string;
  decisionLogId: string;
}

/**
 * AI Dispatch Engine
 * Ranks carriers for a load using deterministic scoring algorithm
 * Inputs: load data, carrier pool, historical metrics
 * Output: ranked list + top recommendation + reason codes
 */
export class AiDispatchService {
  /**
   * Recommend best carrier for a load
   */
  async recommendDispatch(
    tenantId: string,
    loadId: string,
    userId: string
  ): Promise<DispatchRecommendation> {
    // Fetch load and available drivers
    const load = await prisma.load.findUnique({
      where: { id: loadId },
    });

    if (!load || load.tenantId !== tenantId) {
      throw new Error('Load not found or access denied');
    }

    const availableDrivers = await prisma.driver.findMany({
      where: {
        tenantId,
        status: 'AVAILABLE',
      },
    });

    if (availableDrivers.length === 0) {
      throw new Error('No available drivers');
    }

    // Score each driver
    const scoredDrivers = await Promise.all(
      availableDrivers.map(async (driver) => {
        const factors = await this.calculateScoreFactors(
          tenantId,
          driver.id,
          load
        );
        const score = this.calculateCompositeScore(factors);
        return {
          driverId: driver.id,
          score,
          factors,
        };
      })
    );

    // Sort by score descending
    scoredDrivers.sort((a, b) => b.score - a.score);

    const topRecommendation = scoredDrivers[0];
    const reasonCodes = this.generateReasonCodes(topRecommendation.factors);
    const confidence = this.calculateConfidence(topRecommendation.score);

    // Log the decision
    await this.logAiDecision(
      tenantId,
      'LOAD',
      loadId,
      'DISPATCH_RECOMMENDATION',
      `Recommended driver ${topRecommendation.driverId}`,
      confidence,
      reasonCodes,
      { loadId, availableDriverCount: availableDrivers.length },
      { recommendedDriverId: topRecommendation.driverId, score: topRecommendation.score }
    );

    return {
      recommendedDriverId: topRecommendation.driverId,
      score: topRecommendation.score,
      confidence,
      reasonCodes,
      ranking: scoredDrivers,
    };
  }

  /**
   * Execute dispatch: create dispatch record for recommended driver
   */
  async executeDispatch(
    tenantId: string,
    loadId: string,
    driverId: string,
    userId: string
  ): Promise<DispatchExecutionResult> {
    // Verify load and driver exist in tenant
    const load = await prisma.load.findUnique({
      where: { id: loadId },
    });

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!load || load.tenantId !== tenantId) {
      throw new Error('Load not found or access denied');
    }

    if (!driver || driver.tenantId !== tenantId) {
      throw new Error('Driver not found or access denied');
    }

    // Create dispatch record
    const dispatch = await prisma.dispatch.create({
      data: {
        tenantId,
        loadId,
        driverId,
        status: 'ASSIGNED',
      },
    });

    // Log the execution
    await this.logAiDecision(
      tenantId,
      'DISPATCH',
      dispatch.id,
      'DISPATCH_EXECUTED',
      `Dispatch created for load ${loadId} and driver ${driverId}`,
      1.0,
      ['DISPATCH_EXECUTED'],
      { loadId, driverId },
      { dispatchId: dispatch.id, status: dispatch.status }
    );

    return {
      dispatchId: dispatch.id,
      loadId,
      driverId,
      status: dispatch.status,
      decisionLogId: dispatch.id,
    };
  }

  /**
   * Calculate individual score factors for a driver
   */
  private async calculateScoreFactors(
    tenantId: string,
    driverId: string,
    load: any
  ): Promise<Record<string, number>> {
    // Proximity score (0-100): based on distance to pickup
    const proximityScore = this.calculateProximityScore(load.distanceMi);

    // Availability score (0-100)
    const availabilityScore = 100; // Driver is available (filtered earlier)

    // On-time rate (0-100)
    const onTimeScore = await this.calculateOnTimeScore(tenantId, driverId);

    // Acceptance rate (0-100)
    const acceptanceScore = await this.calculateAcceptanceScore(
      tenantId,
      driverId
    );

    // Trust score (0-100) from CarrierScore
    const trustScore = await this.calculateTrustScore(tenantId, driverId);

    // Lane experience score (0-100)
    const laneExperienceScore = await this.calculateLaneExperienceScore(
      tenantId,
      driverId,
      load
    );

    return {
      proximityScore,
      availabilityScore,
      onTimeScore,
      acceptanceScore,
      trustScore,
      laneExperienceScore,
    };
  }

  /**
   * Composite score using weighted formula
   * score = proximity*0.25 + availability*0.20 + onTime*0.20 + acceptance*0.15 + trust*0.15 + laneExp*0.05
   */
  private calculateCompositeScore(factors: Record<string, number>): number {
    const weights = {
      proximityScore: 0.25,
      availabilityScore: 0.2,
      onTimeScore: 0.2,
      acceptanceScore: 0.15,
      trustScore: 0.15,
      laneExperienceScore: 0.05,
    };

    let score = 0;
    for (const [key, weight] of Object.entries(weights)) {
      score += (factors[key] || 0) * weight;
    }

    return Math.round(score);
  }

  /**
   * Proximity score: closer pickup = higher score
   * Assume 500 mi is max distance; closer = better
   */
  private calculateProximityScore(distanceMi: number): number {
    const maxDistance = 500;
    const score = Math.max(0, 100 - (distanceMi / maxDistance) * 100);
    return Math.round(score);
  }

  /**
   * On-time rate from historical dispatches
   */
  private async calculateOnTimeScore(
    tenantId: string,
    driverId: string
  ): Promise<number> {
    // Placeholder: would fetch from Shipment/Dispatch history
    // For now, return 75 (neutral)
    return 75;
  }

  /**
   * Acceptance rate: how often driver accepts loads
   */
  private async calculateAcceptanceScore(
    tenantId: string,
    driverId: string
  ): Promise<number> {
    // Placeholder: would calculate from Dispatch history
    return 80;
  }

  /**
   * Trust score from CarrierScore model
   */
  private async calculateTrustScore(
    tenantId: string,
    driverId: string
  ): Promise<number> {
    const carrierScore = await prisma.carrierScore.findFirst({
      where: {
        tenantId,
        driverId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!carrierScore) {
      return 70; // Default neutral score
    }

    return carrierScore.score;
  }

  /**
   * Lane experience: has driver worked this route before?
   */
  private async calculateLaneExperienceScore(
    tenantId: string,
    driverId: string,
    load: any
  ): Promise<number> {
    // Placeholder: would check historical shipments for same lane
    return 60;
  }

  /**
   * Generate human-readable reason codes
   */
  private generateReasonCodes(factors: Record<string, number>): string[] {
    const codes: string[] = [];

    if (factors.proximityScore > 80) codes.push('CLOSE_TO_PICKUP');
    if (factors.onTimeScore > 85) codes.push('HIGH_ON_TIME_RATE');
    if (factors.acceptanceScore > 85) codes.push('LOW_CANCELLATION_HISTORY');
    if (factors.laneExperienceScore > 70) codes.push('STRONG_LANE_HISTORY');
    if (factors.trustScore > 80) codes.push('HIGH_TRUST_SCORE');

    return codes.length > 0 ? codes : ['BEST_AVAILABLE_MATCH'];
  }

  /**
   * Calculate confidence (0-1) based on score
   */
  private calculateConfidence(score: number): number {
    // Higher score = higher confidence
    // Score 0-100 maps to confidence 0.5-1.0
    return Math.min(1.0, 0.5 + score / 200);
  }

  /**
   * Log AI decision to AiDecisionLog
   */
  private async logAiDecision(
    tenantId: string,
    entityType: string,
    entityId: string,
    module: string,
    decision: string,
    confidence: number,
    reasonCodes: string[],
    inputSnapshot: any,
    outputSnapshot: any
  ): Promise<AiDecisionLog> {
    return prisma.aiDecisionLog.create({
      data: {
        tenantId,
        entityType,
        entityId,
        module,
        decision,
        confidence,
        reasonCodes,
        inputSnapshot,
        outputSnapshot,
      },
    });
  }
}

export const aiDispatchService = new AiDispatchService();
