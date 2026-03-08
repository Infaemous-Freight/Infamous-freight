import { ConstraintSolver } from "./constraint-solver.js";
import { RoutingEngine } from "./routing-engine.js";
import type { DispatchScore, DriverCandidate, LoadCandidate } from "./dispatch.types.js";

export class DispatchOptimizer {
  constructor(
    private readonly constraintSolver = new ConstraintSolver(),
    private readonly routingEngine = new RoutingEngine()
  ) {}

  rankDrivers(load: LoadCandidate, drivers: DriverCandidate[]): DispatchScore[] {
    const scores: DispatchScore[] = [];

    for (const driver of drivers) {
      if (driver.currentLat == null || driver.currentLng == null) continue;

      const constraints = this.constraintSolver.validate(driver, load);
      if (!constraints.valid) continue;

      const deadhead = this.routingEngine.estimateRoute(driver.currentLat, driver.currentLng, load.originLat, load.originLng);
      const linehaul = this.routingEngine.estimateRoute(
        load.originLat,
        load.originLng,
        load.destinationLat,
        load.destinationLng,
        deadhead.eta
      );

      const totalDriveHours = (deadhead.durationMin + linehaul.durationMin) / 60;
      if (totalDriveHours > driver.hoursRemaining) continue;

      let score = 1000;
      score -= deadhead.distanceMi * 4;
      score -= linehaul.durationMin * 0.5;

      const reasons: string[] = [
        `Deadhead ${deadhead.distanceMi}mi`,
        `Linehaul ${linehaul.distanceMi}mi`,
        `ETA ${linehaul.eta.toISOString()}`
      ];

      const pickupSlackMinutes = (load.pickupWindowEnd.getTime() - deadhead.eta.getTime()) / 60000;
      if (pickupSlackMinutes < 0) continue;

      if (pickupSlackMinutes < 60) {
        score -= 120;
        reasons.push("Tight pickup window");
      } else {
        score += 20;
      }

      if (deadhead.distanceMi < 40) {
        score += 80;
        reasons.push("Low deadhead distance");
      }

      scores.push({
        driverId: driver.id,
        totalScore: Number(score.toFixed(2)),
        deadheadDistanceMi: deadhead.distanceMi,
        routeDistanceMi: linehaul.distanceMi,
        estimatedArrival: linehaul.eta,
        reasons
      });
    }

    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }
}
