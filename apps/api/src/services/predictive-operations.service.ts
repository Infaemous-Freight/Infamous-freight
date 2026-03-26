import { prisma } from '../db/prisma';

export interface PredictionResult {
  entityId: string;
  entityType: 'LOAD' | 'SHIPMENT';
  delayProbability: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedAction: string;
  reasonCodes: string[];
  confidence: number;
}

/**
 * Predictive Operations Engine
 * Predicts delays, failures, and cancellations
 * Triggers alerts and auto-reassignment recommendations
 * Inputs: carrier score, lane history, pickup timing, route risk, delay patterns, exceptions
 */
export class PredictiveOperationsService {
  /**
   * Predict operational issues for a load
   */
  async predictLoadIssues(
    tenantId: string,
    loadId: string
  ): Promise<PredictionResult> {
    // Fetch load
    const load = await prisma.load.findUnique({
      where: { id: loadId },
    });

    if (!load || load.tenantId !== tenantId) {
      throw new Error('Load not found or access denied');
    }

    // Calculate prediction factors
    const factors = await this.calculatePredictionFactors(tenantId, load);

    // Calculate delay probability
    const delayProbability = this.calculateDelayProbability(factors);

    // Determine severity
    const severity = this.determineSeverity(delayProbability, factors);

    // Generate recommended action
    const recommendedAction = this.generateRecommendedAction(
      severity,
      delayProbability,
      factors
    );

    // Generate reason codes
    const reasonCodes = this.generatePredictionReasonCodes(
      factors,
      delayProbability
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(factors, delayProbability);

    // Save prediction event
    await prisma.predictionEvent.create({
      data: {
        tenantId,
        entityType: 'LOAD',
        entityId: loadId,
        predictionType: 'DELAY_RISK',
        probability: delayProbability,
        severity,
        recommendation: recommendedAction,
      },
    });

    // Log the decision
    await this.logPredictionDecision(
      tenantId,
      loadId,
      delayProbability,
      severity,
      confidence,
      reasonCodes,
      factors
    );

    return {
      entityId: loadId,
      entityType: 'LOAD',
      delayProbability,
      severity,
      recommendedAction,
      reasonCodes,
      confidence,
    };
  }

  /**
   * Predict issues for a shipment
   */
  async predictShipmentIssues(
    tenantId: string,
    shipmentId: string
  ): Promise<PredictionResult> {
    // Fetch shipment
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment || shipment.tenantId !== tenantId) {
      throw new Error('Shipment not found or access denied');
    }

    // Calculate prediction factors
    const factors = await this.calculateShipmentPredictionFactors(
      tenantId,
      shipment
    );

    // Calculate delay probability
    const delayProbability = this.calculateDelayProbability(factors);

    // Determine severity
    const severity = this.determineSeverity(delayProbability, factors);

    // Generate recommended action
    const recommendedAction = this.generateRecommendedAction(
      severity,
      delayProbability,
      factors
    );

    // Generate reason codes
    const reasonCodes = this.generatePredictionReasonCodes(
      factors,
      delayProbability
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(factors, delayProbability);

    // Save prediction event
    await prisma.predictionEvent.create({
      data: {
        tenantId,
        entityType: 'SHIPMENT',
        entityId: shipmentId,
        predictionType: 'DELAY_RISK',
        probability: delayProbability,
        severity,
        recommendation: recommendedAction,
      },
    });

    // Log the decision
    await this.logPredictionDecision(
      tenantId,
      shipmentId,
      delayProbability,
      severity,
      confidence,
      reasonCodes,
      factors
    );

    return {
      entityId: shipmentId,
      entityType: 'SHIPMENT',
      delayProbability,
      severity,
      recommendedAction,
      reasonCodes,
      confidence,
    };
  }

  /**
   * Calculate prediction factors for a load
   */
  private async calculatePredictionFactors(
    tenantId: string,
    load: any
  ): Promise<Record<string, number>> {
    // Carrier score impact (0-1)
    // Placeholder: would fetch actual carrier score
    const carrierScoreImpact = 0.15;

    // Lane history impact (0-1)
    // High-delay lanes = higher impact
    const laneHistoryImpact = await this.calculateLaneDelayHistory(
      tenantId,
      load.originState,
      load.destState
    );

    // Pickup timing impact (0-1)
    // Peak hours = higher delay risk
    const pickupTimingImpact = this.calculatePickupTimingImpact(load);

    // Route risk impact (0-1)
    // Weather, traffic, construction = higher risk
    const routeRiskImpact = this.calculateRouteRiskImpact(load);

    // Historical delay patterns (0-1)
    // Similar loads with delays = higher impact
    const historicalDelayPatterns =
      await this.calculateHistoricalDelayPatterns(tenantId, load);

    // Exception history (0-1)
    // Previous issues = higher risk
    const exceptionHistory = await this.calculateExceptionHistory(
      tenantId,
      load
    );

    return {
      carrierScoreImpact,
      laneHistoryImpact,
      pickupTimingImpact,
      routeRiskImpact,
      historicalDelayPatterns,
      exceptionHistory,
    };
  }

  /**
   * Calculate prediction factors for a shipment
   */
  private async calculateShipmentPredictionFactors(
    tenantId: string,
    shipment: any
  ): Promise<Record<string, number>> {
    // Similar to load factors but for active shipments
    const carrierScoreImpact = 0.15;
    const laneHistoryImpact = await this.calculateLaneDelayHistory(
      tenantId,
      shipment.originState,
      shipment.destState
    );
    const pickupTimingImpact = 0.1; // Shipment already in transit
    const routeRiskImpact = this.calculateRouteRiskImpact(shipment);
    const historicalDelayPatterns = 0.2;
    const exceptionHistory = 0.1;

    return {
      carrierScoreImpact,
      laneHistoryImpact,
      pickupTimingImpact,
      routeRiskImpact,
      historicalDelayPatterns,
      exceptionHistory,
    };
  }

  /**
   * Calculate lane delay history
   */
  private async calculateLaneDelayHistory(
    tenantId: string,
    originState: string,
    destState: string
  ): Promise<number> {
    // Placeholder: would query historical shipment data for this lane
    // For now, return neutral
    return 0.2;
  }

  /**
   * Calculate pickup timing impact
   */
  private calculatePickupTimingImpact(load: any): number {
    // Placeholder: would check pickup time
    // Peak hours (8-10am, 4-6pm) = higher risk
    return 0.15;
  }

  /**
   * Calculate route risk impact
   */
  private calculateRouteRiskImpact(load: any): number {
    // Placeholder: would check weather, traffic, construction
    // For now, return neutral
    return 0.1;
  }

  /**
   * Calculate historical delay patterns
   */
  private async calculateHistoricalDelayPatterns(
    tenantId: string,
    load: any
  ): Promise<number> {
    // Placeholder: would query similar loads for delays
    return 0.15;
  }

  /**
   * Calculate exception history
   */
  private async calculateExceptionHistory(
    tenantId: string,
    load: any
  ): Promise<number> {
    // Placeholder: would query previous exceptions
    return 0.1;
  }

  /**
   * Calculate delay probability (0-1)
   * Weighted sum of factors
   */
  private calculateDelayProbability(
    factors: Record<string, number>
  ): number {
    const weights = {
      carrierScoreImpact: 0.25,
      laneHistoryImpact: 0.25,
      pickupTimingImpact: 0.15,
      routeRiskImpact: 0.15,
      historicalDelayPatterns: 0.15,
      exceptionHistory: 0.05,
    };

    let probability = 0;
    for (const [key, weight] of Object.entries(weights)) {
      probability += (factors[key] || 0) * weight;
    }

    return Math.min(1.0, probability);
  }

  /**
   * Determine severity based on probability and factors
   */
  private determineSeverity(
    probability: number,
    factors: Record<string, number>
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (probability > 0.7) return 'HIGH';
    if (probability > 0.4) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate recommended action
   */
  private generateRecommendedAction(
    severity: string,
    probability: number,
    factors: Record<string, number>
  ): string {
    if (severity === 'HIGH') {
      return 'CONSIDER_REASSIGNMENT: High delay risk detected. Evaluate alternative carriers or routes.';
    } else if (severity === 'MEDIUM') {
      return 'MONITOR_CLOSELY: Moderate delay risk. Set up alerts for this shipment.';
    } else {
      return 'PROCEED_NORMAL: Low delay risk. Proceed with standard operations.';
    }
  }

  /**
   * Generate reason codes
   */
  private generatePredictionReasonCodes(
    factors: Record<string, number>,
    probability: number
  ): string[] {
    const codes: string[] = [];

    if (factors.laneHistoryImpact > 0.3) codes.push('HIGH_LANE_DELAY_HISTORY');
    if (factors.carrierScoreImpact > 0.3) codes.push('LOW_CARRIER_RELIABILITY');
    if (factors.pickupTimingImpact > 0.2) codes.push('PEAK_HOUR_PICKUP');
    if (factors.routeRiskImpact > 0.2) codes.push('HIGH_ROUTE_RISK');
    if (factors.historicalDelayPatterns > 0.3)
      codes.push('SIMILAR_LOADS_DELAYED');
    if (factors.exceptionHistory > 0.2) codes.push('PREVIOUS_EXCEPTIONS');

    return codes.length > 0 ? codes : ['NORMAL_RISK_PROFILE'];
  }

  /**
   * Calculate confidence (0-1)
   */
  private calculateConfidence(
    factors: Record<string, number>,
    probability: number
  ): number {
    // Confidence based on data completeness
    // All factors present = high confidence
    const factorCount = Object.keys(factors).length;
    const baseConfidence = 0.6 + (factorCount / 6) * 0.3;
    return Math.min(1.0, baseConfidence);
  }

  /**
   * Log prediction decision
   */
  private async logPredictionDecision(
    tenantId: string,
    entityId: string,
    probability: number,
    severity: string,
    confidence: number,
    reasonCodes: string[],
    factors: Record<string, number>
  ): Promise<void> {
    await prisma.aiDecisionLog.create({
      data: {
        tenantId,
        entityType: 'LOAD',
        entityId,
        module: 'PREDICTIVE_OPERATIONS',
        decision: `Delay risk: ${(probability * 100).toFixed(1)}% (${severity})`,
        confidence,
        reasonCodes,
        inputSnapshot: factors,
        outputSnapshot: { probability, severity, confidence },
      },
    });
  }
}

export const predictiveOperationsService = new PredictiveOperationsService();
