import { writeAuditLog } from "../../lib/audit.js";
import { prisma } from "../../lib/prisma.js";
import { dispatchQueue } from "../../lib/queue.js";
import { DispatchOptimizer } from "./dispatch.optimizer.js";

const optimizer = new DispatchOptimizer();

export class DispatchService {
  async recommend(organizationId: string, loadId: string) {
    const load = await prisma.load.findFirst({
      where: { id: loadId, organizationId }
    });

    if (!load) {
      throw new Error("Load not found");
    }

    const drivers = await prisma.driver.findMany({
      where: {
        organizationId,
        status: "AVAILABLE"
      },
      include: {
        truck: true
      }
    });

    return optimizer.rankDrivers(load, drivers);
  }

  async assign(organizationId: string, actorUserId: string, loadId: string, driverId: string) {
    const [load, driver] = await Promise.all([
      prisma.load.findFirst({ where: { id: loadId, organizationId } }),
      prisma.driver.findFirst({ where: { id: driverId, organizationId } })
    ]);

    if (!load || !driver) {
      throw new Error("Load or driver not found");
    }

    const updated = await prisma.load.update({
      where: { id: loadId },
      data: {
        driverId,
        status: "ASSIGNED"
      }
    });

    await writeAuditLog({
      organizationId,
      actorUserId,
      action: "dispatch.assigned",
      entityType: "Load",
      entityId: loadId,
      metadata: { driverId }
    });

    await dispatchQueue.add("recompute", {
      organizationId,
      loadId
    });

    return updated;
  }
}
