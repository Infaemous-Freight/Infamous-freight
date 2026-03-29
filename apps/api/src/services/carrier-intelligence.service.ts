import type { CarrierProfile, EquipmentType, Lane } from "../types/domain.js";
import { prisma } from '../db/prisma.js';


export interface CarrierScoreResult {
  driverId: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  onTimeRate: number;
  cancelRate: number;
  anomalyFlags: string[];
  explanation: string;
}

export class CarrierIntelligenceService {
  // Original methods
  scoreCarrier(carrier: CarrierProfile): number {
    const score =
      0.3 * carrier.onTimeRate +
      0.2 * carrier.tenderAcceptanceRate +
      0.2 * carrier.safetyScore +
      0.15 * carrier.priceCompetitiveness +
      0.15 * carrier.serviceRating;

    return Number(score.toFixed(4));
  }

  rankCarriersForLane(
    carriers: CarrierProfile[],
    lane: Lane,
    equipmentType: EquipmentType
  ) {
    const laneKey = `${lane.origin}->${lane.destination}`;

    return carriers
      .filter(
        (carrier) =>
          carrier.equipmentTypes.includes(equipmentType) &&
          carrier.activeLanes.includes(laneKey)
      )
      .map((carrier) => ({
        carrier,
        score: this.scoreCarrier(carrier)
      }))
      .sort((a, b) => b.score - a.score);
  }

  chooseBestCarrier(
    carriers: CarrierProfile[],
    lane: Lane,
    equipmentType: EquipmentType
  ) {
    const ranked = this.rankCarriersForLane(carriers, lane, equipmentType);
    return ranked[0] ?? null;
  }

  // Phase 2: AI-powered carrier scoring and fraud detection

  /**
   * Compute or recompute carrier score
   * Base score: 100, subtract penalties for violations
   */
  async computeCarrierScore(
    tenantId: string,
    driverId: string
  ): Promise<CarrierScoreResult> {
    // Fetch driver
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver || driver.tenantId !== tenantId) {
      throw new Error('Driver not found or access denied');
    }

    // Calculate metrics from historical data
    const metrics = await this.calculateDriverMetrics(tenantId, driverId);

    // Start with base score of 100
    let score = 100;
    const anomalyFlags: string[] = [];

    // Apply penalties
    // Late delivery pattern: -10 to -25
    if (metrics.lateDeliveryRate > 0.3) {
      score -= 25;
      anomalyFlags.push('HIGH_LATE_DELIVERY_RATE');
    } else if (metrics.lateDeliveryRate > 0.15) {
      score -= 15;
      anomalyFlags.push('ELEVATED_LATE_DELIVERY_RATE');
    } else if (metrics.lateDeliveryRate > 0.05) {
      score -= 10;
    }

    // Frequent cancellations: -15 to -30
    if (metrics.cancelRate > 0.25) {
      score -= 30;
      anomalyFlags.push('FREQUENT_CANCELLATIONS');
    } else if (metrics.cancelRate > 0.15) {
      score -= 20;
      anomalyFlags.push('ELEVATED_CANCELLATION_RATE');
    } else if (metrics.cancelRate > 0.05) {
      score -= 15;
    }

    // Documentation gaps: -5 to -15
    if (metrics.incompleteDocumentationRate > 0.3) {
      score -= 15;
      anomalyFlags.push('INCOMPLETE_PROFILE');
    } else if (metrics.incompleteDocumentationRate > 0.1) {
      score -= 8;
    }

    // Suspicious route behavior: -20 to -40
    if (metrics.routeDeviationScore > 0.7) {
      score -= 40;
      anomalyFlags.push('HIGH_FRAUD_RISK');
    } else if (metrics.routeDeviationScore > 0.5) {
      score -= 25;
      anomalyFlags.push('SUSPICIOUS_ROUTE_BEHAVIOR');
    } else if (metrics.routeDeviationScore > 0.3) {
      score -= 15;
    }

    // Repeated disputes: -10 to -20
    if (metrics.disputeRate > 0.2) {
      score -= 20;
      anomalyFlags.push('HIGH_DISPUTE_FREQUENCY');
    } else if (metrics.disputeRate > 0.1) {
      score -= 12;
    }

    // Ensure score stays in 0-100 range
    score = Math.max(0, Math.min(100, score));

    // Determine risk level
    const riskLevel = this.determineRiskLevel(score);

    // Generate explanation
    const explanation = this.generateExplanation(
      score,
      riskLevel,
      metrics,
      anomalyFlags
    );

    // Save or update CarrierScore record
    const carrierScore = await prisma.carrierScore.upsert({
      where: {
        id: `${tenantId}-${driverId}`, // Assuming composite key or unique constraint
      },
      update: {
        score,
        riskLevel,
        onTimeRate: metrics.onTimeRate,
        cancelRate: metrics.cancelRate,
        anomalyFlags,
        explanation,
      },
      create: {
        tenantId,
        driverId,
        score,
        riskLevel,
        onTimeRate: metrics.onTimeRate,
        cancelRate: metrics.cancelRate,
        anomalyFlags,
        explanation,
      },
    });

    // Log the decision
    await this.logCarrierScoreDecision(
      tenantId,
      driverId,
      score,
      riskLevel,
      anomalyFlags,
      metrics
    );

    return {
      driverId,
      score,
      riskLevel,
      onTimeRate: metrics.onTimeRate,
      cancelRate: metrics.cancelRate,
      anomalyFlags,
      explanation,
    };
  }

  /**
   * Get current carrier score
   */
  async getCarrierScore(
    tenantId: string,
    driverId: string
  ): Promise<CarrierScoreResult | null> {
    const carrierScore = await prisma.carrierScore.findFirst({
      where: {
        tenantId,
        driverId,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!carrierScore) {
      return null;
    }

    return {
      driverId,
      score: carrierScore.score,
      riskLevel: carrierScore.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
      onTimeRate: carrierScore.onTimeRate || 0,
      cancelRate: carrierScore.cancelRate || 0,
      anomalyFlags: (carrierScore.anomalyFlags as string[]) || [],
      explanation: carrierScore.explanation || '',
    };
  }

  /**
   * Calculate driver metrics from historical data
   */
  private async calculateDriverMetrics(
    tenantId: string,
    driverId: string
  ): Promise<Record<string, number>> {
    // Placeholder metrics - would fetch from Dispatch/Shipment history
    // In production, these would be calculated from actual historical data

    return {
      onTimeRate: 0.92, // 92% on-time deliveries
      lateDeliveryRate: 0.08, // 8% late
      cancelRate: 0.05, // 5% cancellations
      incompleteDocumentationRate: 0.02, // 2% incomplete docs
      routeDeviationScore: 0.15, // 0-1 scale, 0 = perfect, 1 = highly suspicious
      disputeRate: 0.03, // 3% disputes
    };
  }

  /**
   * Determine risk level from score
   * 80-100 = LOW, 60-79 = MEDIUM, <60 = HIGH
   */
  private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 80) return 'LOW';
    if (score >= 60) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    score: number,
    riskLevel: string,
    metrics: Record<string, number>,
    anomalyFlags: string[]
  ): string {
    const parts: string[] = [];

    parts.push(`Carrier risk assessment: ${riskLevel} (score: ${score}/100)`);

    if (metrics.onTimeRate > 0.9) {
      parts.push('Strong on-time delivery performance.');
    } else if (metrics.onTimeRate < 0.8) {
      parts.push('Below-average on-time performance.');
    }

    if (metrics.cancelRate > 0.1) {
      parts.push('Elevated cancellation rate detected.');
    }

    if (anomalyFlags.length > 0) {
      parts.push(`Flags: ${anomalyFlags.join(', ')}`);
    }

    return parts.join(' ');
  }

  /**
   * Log carrier score decision
   */
  private async logCarrierScoreDecision(
    tenantId: string,
    driverId: string,
    score: number,
    riskLevel: string,
    anomalyFlags: string[],
    metrics: Record<string, number>
  ): Promise<void> {
    await prisma.aiDecisionLog.create({
      data: {
        tenantId,
        entityType: 'DRIVER',
        entityId: driverId,
        module: 'CARRIER_INTELLIGENCE',
        decision: `Carrier score computed: ${score} (${riskLevel})`,
        confidence: 0.95,
        reasonCodes: anomalyFlags,
        inputSnapshot: metrics,
        outputSnapshot: { score, riskLevel, anomalyFlags },
      },
    });
  }
}
