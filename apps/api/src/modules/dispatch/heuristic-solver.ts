import { DispatchOptimizer } from "./dispatch.optimizer.js";
import type { SolverProvider } from "./solver-provider.js";
import type {
  DispatchScore,
  DriverCandidate,
  LoadCandidate
} from "./dispatch.types.js";

export class HeuristicSolverProvider implements SolverProvider {
  constructor(private readonly optimizer = new DispatchOptimizer()) {}

  async solve(load: LoadCandidate, drivers: DriverCandidate[]): Promise<DispatchScore[]> {
    return this.optimizer.rankDrivers(load, drivers);
  }
}
