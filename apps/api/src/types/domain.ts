export type EquipmentType = "VAN" | "REEFER" | "FLATBED";
export type ShipmentStatus =
  | "CREATED"
  | "POSTED"
  | "BOOKED"
  | "IN_TRANSIT"
  | "DELAYED"
  | "DELIVERED";

export interface Lane {
  origin: string;
  destination: string;
  distanceMiles: number;
}

export interface CarrierProfile {
  id: string;
  name: string;
  onTimeRate: number; // 0..1
  tenderAcceptanceRate: number; // 0..1
  safetyScore: number; // 0..1
  priceCompetitiveness: number; // 0..1
  serviceRating: number; // 0..1
  equipmentTypes: EquipmentType[];
  activeLanes: string[];
}

export interface Shipment {
  id: string;
  lane: Lane;
  equipmentType: EquipmentType;
  weightLbs: number;
  pickupAt: string;
  status: ShipmentStatus;
  carrierId?: string;
}

export interface RatePredictionInput {
  lane: Lane;
  equipmentType: EquipmentType;
  fuelPriceUsdPerGallon: number;
  seasonalityIndex: number; // 0.8..1.2
  marketCapacityIndex: number; // 0.8..1.2 (low capacity = higher price)
  demandIndex: number; // 0.8..1.2
  historicalSpotRatePerMile: number;
}

export interface RatePredictionResult {
  predictedRatePerMile: number;
  confidenceScore: number;
  estimatedLinehaul: number;
  marginSuggestedPct: number;
}

export interface EtaRiskInput {
  currentLat?: number;
  currentLng?: number;
  distanceRemainingMiles: number;
  averageSpeedMph: number;
  weatherRisk: number; // 0..1
  trafficRisk: number; // 0..1
  carrierReliability: number; // 0..1
}

export interface EtaRiskResult {
  estimatedArrivalHours: number;
  delayProbability: number;
  riskBand: "LOW" | "MEDIUM" | "HIGH";
}
