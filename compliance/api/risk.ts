export interface RiskFactors {
  deviceFingerprintMatch: boolean;
  ipReputationScore: number;
  kycVerified: boolean;
  transactionVelocity: number;
  disputeHistoryCount: number;
}

export interface RiskScoreResult {
  userId: string;
  score: number;
  factors: RiskFactors;
  createdAt: string;
}

const scores = new Map<string, RiskScoreResult>();

export function scoreRisk(userId: string, factors: RiskFactors): RiskScoreResult {
  const score = calculateScore(factors);
  const result: RiskScoreResult = {
    userId,
    score,
    factors,
    createdAt: new Date().toISOString(),
  };

  scores.set(userId, result);
  return result;
}

export function getRiskScore(userId: string): RiskScoreResult | undefined {
  return scores.get(userId);
}

function calculateScore(factors: RiskFactors): number {
  const fingerprintPenalty = factors.deviceFingerprintMatch ? 0 : 15;
  const ipPenalty = Math.max(0, 30 - factors.ipReputationScore * 30);
  const kycPenalty = factors.kycVerified ? 0 : 20;
  const velocityPenalty = Math.min(20, factors.transactionVelocity * 2);
  const disputePenalty = Math.min(15, factors.disputeHistoryCount * 3);

  const raw = fingerprintPenalty + ipPenalty + kycPenalty + velocityPenalty + disputePenalty;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
