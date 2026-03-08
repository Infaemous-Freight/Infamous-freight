import { ConstraintSolver } from "./constraint-solver.js";
import { LocalRouteProvider } from "./local-route-provider.js";
import type { RouteProvider } from "./route-provider.js";
import type {
  DispatchScore,
  DriverCandidate,
  LoadCandidate
} from "./dispatch.types.js";

export class DispatchOptimizer {
  private readonly constraints = new ConstraintSolver();

  constructor(private readonly routeProvider: RouteProvider = new LocalRouteProvider()) {}

  async rankDrivers(
    load: LoadCandidate,
    drivers: DriverCandidate[]
  ): Promise<DispatchScore[]> {
    const rankings: DispatchScore[] = [];

    for (const driver of drivers) {
      if (driver.currentLat == null || driver.currentLng == null) continue;

      const validity = this.constraints.validate(driver, load);
      if (!validity.valid) continue;

      const [deadhead, linehaul] = await Promise.all([
        this.routeProvider.estimateRoute(
          driver.currentLat,
          driver.currentLng,
          load.originLat,
          load.originLng
        ),
        this.routeProvider.estimateRoute(
          load.originLat,
          load.originLng,
          load.destinationLat,
          load.destinationLng
        )
      ]);
      const totalHours = (deadhead.durationMin + linehaul.durationMin) / 60;
      if (totalHours > driver.hoursRemaining) continue;

      let totalScore = 1000;
      totalScore -= deadhead.distanceMi * 4;
      totalScore -= linehaul.durationMin * 0.5;

      const reasons = [
        `deadhead=${deadhead.distanceMi}mi`,
        `linehaul=${linehaul.distanceMi}mi`
      ];

      if (deadhead.distanceMi < 40) {
        totalScore += 80;
        reasons.push("low-deadhead");
      }

      rankings.push({
        driverId: driver.id,
        totalScore: Number(totalScore.toFixed(2)),
        deadheadDistanceMi: deadhead.distanceMi,
        routeDistanceMi: linehaul.distanceMi,
        estimatedArrival: new Date(
          Date.now() + (deadhead.durationMin + linehaul.durationMin) * 60000
        ),
        reasons
      });
    }

    return rankings.sort((a, b) => b.totalScore - a.totalScore);
  }
}
