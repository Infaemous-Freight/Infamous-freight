import type { RouteProvider } from "./route-provider.js";

export class DispatchOptimizer {
  constructor(private readonly routeProvider?: RouteProvider) {}

  async rankDrivers<TDriver>(_: unknown, drivers: TDriver[]): Promise<TDriver[]> {
    void this.routeProvider;
    return drivers;
  }
}
