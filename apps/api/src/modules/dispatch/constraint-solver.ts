import type { DriverCandidate, LoadCandidate } from "./dispatch.types.js";

export class ConstraintSolver {
  validate(driver: DriverCandidate, load: LoadCandidate) {
    if (driver.truck && load.weightLbs > driver.truck.maxWeightLbs) {
      return { valid: false, reason: "overweight" };
    }

    if (driver.trailerType !== load.trailerType) {
      return { valid: false, reason: "trailer-mismatch" };
    }

    if (load.hazmat && !driver.hazmatCertified) {
      return { valid: false, reason: "hazmat-required" };
    }

    return { valid: true };
  }
}
