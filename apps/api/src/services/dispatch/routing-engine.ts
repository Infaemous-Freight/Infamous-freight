import { haversineMiles } from "../../utils/geo.js";
import type { RouteEstimate } from "./dispatch.types.js";

export class RoutingEngine {
  estimateRoute(fromLat: number, fromLng: number, toLat: number, toLng: number, departureAt = new Date()): RouteEstimate {
    const distanceMi = haversineMiles(fromLat, fromLng, toLat, toLng);
    const adjustedDistance = distanceMi * 1.18;
    const avgSpeedMph = 52;
    const durationMin = Math.ceil((adjustedDistance / avgSpeedMph) * 60);
    const eta = new Date(departureAt.getTime() + durationMin * 60_000);

    return {
      distanceMi: Number(adjustedDistance.toFixed(2)),
      durationMin,
      eta
    };
  }
}
