export class CarrierRiskService {
  calculateRiskScore(input: {
    recentCarrierChanges: number;
    suspiciousDocumentUploads: number;
    afterHoursPickupAttempts: number;
    failedCheckCalls: number;
    priorFlags: number;
  }) {
    let score = 0;
    score += input.recentCarrierChanges * 12;
    score += input.suspiciousDocumentUploads * 18;
    score += input.afterHoursPickupAttempts * 15;
    score += input.failedCheckCalls * 20;
    score += input.priorFlags * 25;

    score = Math.min(100, score);

    return {
      score,
      severity: score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW"
    };
  }
}
