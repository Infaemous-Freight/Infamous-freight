import type { RouteEstimate, RouteProvider } from "./route-provider.js";

export class LocalRouteProvider implements RouteProvider {
  async estimateRoute(): Promise<RouteEstimate> {
    return {
      distanceMi: 0,
      durationMin: 0
    };
  }
}
