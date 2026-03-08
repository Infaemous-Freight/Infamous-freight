export type RouteEstimate = {
  distanceMi: number;
  durationMin: number;
  polyline?: string;
};

export interface RouteProvider {
  estimateRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<RouteEstimate>;
}
