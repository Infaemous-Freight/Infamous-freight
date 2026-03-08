import type { CarrierProfile, EquipmentType, Lane } from "../types/domain.js";

export class CarrierIntelligenceService {
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
}
