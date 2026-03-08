import type {
  RatePredictionInput,
  RatePredictionResult
} from "../types/domain.js";

export class RatePredictionService {
  predict(input: RatePredictionInput): RatePredictionResult {
    const {
      lane,
      fuelPriceUsdPerGallon,
      seasonalityIndex,
      marketCapacityIndex,
      demandIndex,
      historicalSpotRatePerMile
    } = input;

    const fuelAdjustment = (fuelPriceUsdPerGallon - 3.25) * 0.04;
    const compositeMultiplier =
      seasonalityIndex * marketCapacityIndex * demandIndex;

    const baseRate =
      historicalSpotRatePerMile * compositeMultiplier + fuelAdjustment;

    const distancePenalty =
      lane.distanceMiles < 250 ? 0.18 : lane.distanceMiles < 600 ? 0.08 : 0;

    const predictedRatePerMile = Math.max(1.25, baseRate + distancePenalty);
    const estimatedLinehaul = predictedRatePerMile * lane.distanceMiles;

    const volatility =
      Math.abs(compositeMultiplier - 1) + Math.abs(fuelAdjustment);
    const confidenceScore = Math.max(
      0.55,
      Math.min(0.97, 0.95 - volatility * 0.2)
    );

    const marginSuggestedPct =
      predictedRatePerMile > historicalSpotRatePerMile ? 0.12 : 0.09;

    return {
      predictedRatePerMile: Number(predictedRatePerMile.toFixed(2)),
      confidenceScore: Number(confidenceScore.toFixed(2)),
      estimatedLinehaul: Number(estimatedLinehaul.toFixed(2)),
      marginSuggestedPct: Number(marginSuggestedPct.toFixed(2))
    };
  }
}
