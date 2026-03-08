import type {
  DispatchScore,
  DriverCandidate,
  LoadCandidate
} from "./dispatch.types.js";

export interface SolverProvider {
  solve(load: LoadCandidate, drivers: DriverCandidate[]): Promise<DispatchScore[]>;
}
