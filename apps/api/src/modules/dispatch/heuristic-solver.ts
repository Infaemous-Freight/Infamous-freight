import { DispatchOptimizer } from "./dispatch.optimizer.js";
import type { SolverProvider } from "./solver-provider.js";
import type { DriverCandidate, LoadCandidate, DispatchScore } from "./dispatch.types.js";

export class HeuristicSolverProvider implements SolverProvider {
  constructor(private readonly optimizer: DispatchOptimizer = new DispatchOptimizer()) {}

  async solve(load: LoadCandidate, drivers: DriverCandidate[]): Promise<DispatchScore[]> {
    return this.optimizer.rankDrivers(load, drivers);
  }
}
