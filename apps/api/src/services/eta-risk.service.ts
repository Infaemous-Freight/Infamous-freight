import type { EtaRiskInput, EtaRiskResult } from "../types/domain.js";

export class EtaRiskService {
  predict(input: EtaRiskInput): EtaRiskResult {
    const {
      distanceRemainingMiles,
      averageSpeedMph,
      weatherRisk,
      trafficRisk,
      carrierReliability
    } = input;

    const safeSpeed = Math.max(20, averageSpeedMph);
    const rawHours = distanceRemainingMiles / safeSpeed;

    const disruptionFactor =
      1 +
      weatherRisk * 0.22 +
      trafficRisk * 0.18 +
      (1 - carrierReliability) * 0.2;

    const estimatedArrivalHours = Number((rawHours * disruptionFactor).toFixed(2));

    const delayProbability = Math.max(
      0.03,
      Math.min(
        0.95,
        weatherRisk * 0.35 +
          trafficRisk * 0.3 +
          (1 - carrierReliability) * 0.35
      )
    );

    const riskBand: EtaRiskResult["riskBand"] =
      delayProbability < 0.3 ? "LOW" : delayProbability < 0.6 ? "MEDIUM" : "HIGH";

    return {
      estimatedArrivalHours,
      delayProbability: Number(delayProbability.toFixed(2)),
      riskBand
    };
  }
}
