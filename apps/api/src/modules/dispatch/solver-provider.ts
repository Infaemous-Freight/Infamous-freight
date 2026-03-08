import type { DriverCandidate, LoadCandidate, DispatchScore } from "./dispatch.types.js";

export interface SolverProvider {
  solve(load: LoadCandidate, drivers: DriverCandidate[]): Promise<DispatchScore[]>;
}
