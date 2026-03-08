import type { DriverCandidate, LoadCandidate } from "./dispatch.types.js";

export type ConstraintResult = {
  valid: boolean;
  reasons: string[];
};

export class ConstraintSolver {
  validate(driver: DriverCandidate, load: LoadCandidate): ConstraintResult {
    const reasons: string[] = [];

    if (!driver.truck) reasons.push("Driver has no assigned truck");
    if (driver.truck && !driver.truck.active) reasons.push("Truck is inactive");
    if (driver.truck && driver.truck.maxWeightLbs < load.weightLbs) {
      reasons.push("Truck max weight is below load weight");
    }
    if (driver.trailerType !== load.trailerType) reasons.push("Driver trailer type does not match load");
    if (driver.truck && driver.truck.trailerType !== load.trailerType) {
      reasons.push("Truck trailer type does not match load");
    }
    if (load.hazmat && !driver.hazmatCertified) reasons.push("Driver is not hazmat certified");
    if (driver.hoursRemaining <= 0) reasons.push("Driver has no legal driving hours remaining");

    return {
      valid: reasons.length === 0,
      reasons
    };
  }
}
