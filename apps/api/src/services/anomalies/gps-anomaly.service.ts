import { haversineMiles } from "../../utils/geo.js";

type GpsPoint = {
  lat: number;
  lng: number;
  recordedAt: Date;
  speedMph?: number | null;
};

type PlannedRouteCheckpoint = {
  lat: number;
  lng: number;
};

export class GpsAnomalyService {
  detectRouteDeviation(current: GpsPoint, plannedPath: PlannedRouteCheckpoint[], maxAllowedDeviationMi = 15) {
    let minDistance = Number.POSITIVE_INFINITY;

    for (const checkpoint of plannedPath) {
      const d = haversineMiles(current.lat, current.lng, checkpoint.lat, checkpoint.lng);
      if (d < minDistance) minDistance = d;
    }

    const score = Math.min(100, minDistance * 4);

    return {
      anomalous: minDistance > maxAllowedDeviationMi,
      score: Number(score.toFixed(2)),
      minDistanceFromPlannedRouteMi: Number(minDistance.toFixed(2))
    };
  }

  detectGpsSignalLoss(lastPingAt: Date, now = new Date(), thresholdMin = 20) {
    const minutes = (now.getTime() - lastPingAt.getTime()) / 60000;
    return {
      anomalous: minutes > thresholdMin,
      score: Math.min(100, minutes * 2),
      minutesWithoutSignal: Number(minutes.toFixed(1))
    };
  }

  detectSuspiciousStop(pings: GpsPoint[], stopThresholdMin = 45) {
    if (pings.length < 2) {
      return { anomalous: false, score: 0, stationaryMinutes: 0 };
    }

    const first = pings[0]!;
    const last = pings[pings.length - 1]!;
    const moved = haversineMiles(first.lat, first.lng, last.lat, last.lng);
    const stationaryMinutes = (last.recordedAt.getTime() - first.recordedAt.getTime()) / 60000;

    const anomalous = moved < 0.2 && stationaryMinutes >= stopThresholdMin;

    return {
      anomalous,
      score: anomalous ? Math.min(100, stationaryMinutes) : 0,
      stationaryMinutes: Number(stationaryMinutes.toFixed(1)),
      movedMiles: Number(moved.toFixed(2))
    };
  }
}
