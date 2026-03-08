import type { RouteEstimate, RouteProvider } from "./route-provider.js";
import { env } from "../../config/env.js";

export class MapboxRouteProvider implements RouteProvider {
  async estimateRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<RouteEstimate> {
    if (!env.MAPBOX_ACCESS_TOKEN) {
      throw new Error("MAPBOX_ACCESS_TOKEN is not configured");
    }

    const url = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}`
    );
    url.searchParams.set("access_token", env.MAPBOX_ACCESS_TOKEN);
    url.searchParams.set("geometries", "polyline");
    url.searchParams.set("overview", "full");

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Mapbox routing failed: ${res.status}`);
    }

    const json = await res.json() as {
      routes?: Array<{ distance: number; duration: number; geometry?: string }>;
    };

    const route = json.routes?.[0];
    if (!route) {
      throw new Error("No route returned from Mapbox");
    }

    return {
      distanceMi: Number((route.distance / 1609.344).toFixed(2)),
      durationMin: Math.ceil(route.duration / 60),
      polyline: route.geometry
    };
  }
}
