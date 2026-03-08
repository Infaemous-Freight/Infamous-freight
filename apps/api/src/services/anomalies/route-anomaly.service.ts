import { bearingDegrees, haversineMiles } from "../../utils/geo.js";

type Point = {
  lat: number;
  lng: number;
};

export class RouteAnomalyService {
  detectWrongDirection(current: Point, nextExpected: Point, destination: Point) {
    const expectedBearing = bearingDegrees(current.lat, current.lng, nextExpected.lat, nextExpected.lng);
    const destinationBearing = bearingDegrees(current.lat, current.lng, destination.lat, destination.lng);
    const bearingDiff = Math.abs(expectedBearing - destinationBearing);
    const normalizedDiff = Math.min(bearingDiff, 360 - bearingDiff);

    return {
      anomalous: normalizedDiff > 90,
      score: Number(Math.min(100, normalizedDiff).toFixed(2)),
      expectedBearing: Number(expectedBearing.toFixed(2)),
      destinationBearing: Number(destinationBearing.toFixed(2))
    };
  }

  detectExcessDistance(current: Point, destination: Point, plannedRemainingMiles: number) {
    const straightLine = haversineMiles(current.lat, current.lng, destination.lat, destination.lng);
    const ratio = plannedRemainingMiles === 0 ? 1 : straightLine / plannedRemainingMiles;

    return {
      anomalous: ratio > 1.5,
      score: Number(Math.min(100, ratio * 40).toFixed(2)),
      remainingStraightLineMiles: Number(straightLine.toFixed(2)),
      ratio: Number(ratio.toFixed(2))
    };
  }
}
