import { prisma } from "../../lib/prisma.js";
import { dispatchQueue } from "../../lib/queue.js";
import { HeuristicSolverProvider } from "./heuristic-solver.js";
import { DispatchOptimizer } from "./dispatch.optimizer.js";
import { LocalRouteProvider } from "./local-route-provider.js";
import { MapboxRouteProvider } from "./mapbox-route-provider.js";
import { env } from "../../config/env.js";

const solver = new HeuristicSolverProvider(
  new DispatchOptimizer(env.MAPBOX_ACCESS_TOKEN ? new MapboxRouteProvider() : new LocalRouteProvider())
);

export class DispatchService {
  async recommend(organizationId: string, loadId: string) {
    const load = await prisma.load.findFirst({
      where: { id: loadId, organizationId }
    });

    if (!load) throw new Error("Load not found");

    const drivers = await prisma.driver.findMany({
      where: { organizationId, status: "AVAILABLE" },
      include: { truck: true }
    });

    return solver.solve(load, drivers);
  }

  async assign(organizationId: string, _actorUserId: string, loadId: string, driverId: string) {
    const [load, driver] = await Promise.all([
      prisma.load.findFirst({ where: { id: loadId, organizationId } }),
      prisma.driver.findFirst({ where: { id: driverId, organizationId } })
    ]);

    if (!load || !driver) throw new Error("Load or driver not found");

    const updated = await prisma.load.update({
      where: { id: loadId },
      data: {
        driverId,
        status: "ASSIGNED"
      }
    });

    await dispatchQueue.add("recompute", { organizationId, loadId });

    return updated;
  }
}
