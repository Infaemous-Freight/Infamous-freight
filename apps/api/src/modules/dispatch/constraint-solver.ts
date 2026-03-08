import type { DriverCandidate, LoadCandidate } from "./dispatch.types.js";

export class ConstraintSolver {
  validate(driver: DriverCandidate, load: LoadCandidate) {
    const reasons: string[] = [];

    if (!driver.truck) reasons.push("Driver has no truck");
    if (driver.truck && !driver.truck.active) reasons.push("Truck inactive");
    if (driver.truck && driver.truck.maxWeightLbs < load.weightLbs) {
      reasons.push("Truck weight limit exceeded");
    }
    if (driver.trailerType !== load.trailerType) {
      reasons.push("Trailer type mismatch");
    }
    if (load.hazmat && !driver.hazmatCertified) {
      reasons.push("Hazmat certification missing");
    }
    if (driver.hoursRemaining <= 0) {
      reasons.push("No legal hours remaining");
    }

    return {
      valid: reasons.length === 0,
      reasons
    };
  }
}
