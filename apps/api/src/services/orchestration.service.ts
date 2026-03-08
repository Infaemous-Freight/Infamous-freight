import type { CarrierProfile } from "../types/domain.js";
import { AICommandService } from "./ai-command.service.js";
import { CarrierIntelligenceService } from "./carrier-intelligence.service.js";
import { EtaRiskService } from "./eta-risk.service.js";
import { RatePredictionService } from "./rate-prediction.service.js";

const demoCarriers: CarrierProfile[] = [
  {
    id: "carr_1",
    name: "Atlas Freight Lines",
    onTimeRate: 0.94,
    tenderAcceptanceRate: 0.91,
    safetyScore: 0.96,
    priceCompetitiveness: 0.84,
    serviceRating: 0.92,
    equipmentTypes: ["VAN", "REEFER"],
    activeLanes: ["dallas->atlanta", "oklahoma city->dallas"]
  },
  {
    id: "carr_2",
    name: "Iron Route Transport",
    onTimeRate: 0.9,
    tenderAcceptanceRate: 0.95,
    safetyScore: 0.88,
    priceCompetitiveness: 0.9,
    serviceRating: 0.86,
    equipmentTypes: ["VAN", "FLATBED"],
    activeLanes: ["dallas->atlanta", "houston->memphis"]
  }
];

export class OrchestrationService {
  constructor(
    private readonly ai = new AICommandService(),
    private readonly carriers = new CarrierIntelligenceService(),
    private readonly rates = new RatePredictionService(),
    private readonly eta = new EtaRiskService()
  ) {}

  execute(command: string) {
    const parsed = this.ai.parse(command);

    if (parsed.type === "PRICE_LOAD") {
      const lane = {
        origin: parsed.origin,
        destination: parsed.destination,
        distanceMiles: 781
      };

      const rate = this.rates.predict({
        lane,
        equipmentType: "VAN",
        fuelPriceUsdPerGallon: 3.49,
        seasonalityIndex: 1.04,
        marketCapacityIndex: 1.07,
        demandIndex: 1.05,
        historicalSpotRatePerMile: 2.11
      });

      return {
        action: "PRICE_LOAD",
        lane,
        result: rate
      };
    }

    if (parsed.type === "FIND_CARRIER") {
      const lane = {
        origin: parsed.origin,
        destination: parsed.destination,
        distanceMiles: 781
      };

      const best = this.carriers.chooseBestCarrier(demoCarriers, lane, "VAN");

      return {
        action: "FIND_CARRIER",
        lane,
        result: best
      };
    }

    if (parsed.type === "PREDICT_DELAY") {
      const eta = this.eta.predict({
        distanceRemainingMiles: 212,
        averageSpeedMph: 54,
        weatherRisk: 0.28,
        trafficRisk: 0.19,
        carrierReliability: 0.88
      });

      return {
        action: "PREDICT_DELAY",
        shipmentId: parsed.shipmentId,
        result: eta
      };
    }

    return {
      action: "UNKNOWN",
      message: "Command not recognized",
      examples: [
        "price load from Dallas to Atlanta",
        "find carrier from Dallas to Atlanta",
        "predict delay for shipment sh_123"
      ]
    };
  }
}
