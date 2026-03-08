type CarrierTelemetry = {
  recentCarrierChanges: number;
  suspiciousDocumentUploads: number;
  afterHoursPickupAttempts: number;
  failedCheckCalls: number;
  priorFlags: number;
};

export class CarrierRiskService {
  calculateRiskScore(data: CarrierTelemetry) {
    let score = 0;
    score += data.recentCarrierChanges * 12;
    score += data.suspiciousDocumentUploads * 18;
    score += data.afterHoursPickupAttempts * 15;
    score += data.failedCheckCalls * 20;
    score += data.priorFlags * 25;

    score = Math.min(100, score);

    let severity = "LOW";
    if (score >= 70) severity = "HIGH";
    else if (score >= 40) severity = "MEDIUM";

    return { score, severity };
  }
}
