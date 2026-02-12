import type { RiskFactors, RiskScoreResult } from "../apps/api/risk";
import { scoreRisk } from "../apps/api/risk";

export interface GenesisInput {
  userId: string;
  factors: RiskFactors;
  /**
   * Optional correlation identifiers for audit / tracing purposes.
   *
   * These IDs may be used by upstream callers or logging/monitoring layers
   * to tie a Genesis risk assessment back to a specific transaction or
   * application session. They are not currently consumed by
   * runGenesisAssessment itself.
   */
  transactionId?: string;
  sessionId?: string;
}

export interface GenesisAssessment {
  risk: RiskScoreResult;
  alerts: string[];
  recommendations: string[];
}

export function runGenesisAssessment(input: GenesisInput): GenesisAssessment {
  const risk = scoreRisk(input.userId, input.factors);
  const alerts = buildAlerts(risk.score, input.factors);
  const recommendations = buildRecommendations(risk.score, input.factors);

  return {
    risk,
    alerts,
    recommendations,
  };
}

function buildAlerts(score: number, factors: RiskFactors): string[] {
  const alerts: string[] = [];

  if (!factors.deviceFingerprintMatch) {
    alerts.push("Device fingerprint mismatch detected.");
  }

  if (!factors.kycVerified) {
    alerts.push("KYC verification missing or incomplete.");
  }

  if (factors.ipReputationScore < 0.4) {
    alerts.push("Low IP reputation score detected.");
  }

  if (score >= 70) {
    alerts.push("High risk score threshold exceeded.");
  }

  return alerts;
}

function buildRecommendations(score: number, factors: RiskFactors): string[] {
  const recommendations: string[] = [];

  if (score >= 70) {
    recommendations.push("Trigger manual compliance review.");
    recommendations.push("Apply temporary transaction restriction.");
  } else if (score >= 40) {
    recommendations.push("Request additional verification documentation.");
  }

  if (factors.transactionVelocity >= 5) {
    recommendations.push("Throttle transaction velocity for 24 hours.");
  }

  if (factors.disputeHistoryCount >= 3) {
    recommendations.push("Escalate account to enforcement queue.");
  }

  if (recommendations.length === 0) {
    recommendations.push("No enforcement action required. Continue monitoring.");
  }

  return recommendations;
}
