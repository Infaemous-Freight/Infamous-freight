import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireScope } from "../middleware/requireScope.js";
import { DispatchOptimizer } from "../services/dispatch/dispatch-optimizer.js";

export const dispatchRouter = Router();
const optimizer = new DispatchOptimizer();

dispatchRouter.post("/:loadId/recommend", requireScope("dispatch.recommend"), async (req, res, next) => {
  try {
    const organizationId = req.auth!.organizationId;
    const { loadId } = req.params;

    const load = await prisma.load.findFirst({
      where: { id: loadId, organizationId }
    });

    if (!load) {
      return res.status(404).json({ error: "Load not found" });
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

    const rankings = optimizer.rankDrivers(load, drivers);

    return res.json({
      loadId,
      organizationId,
      recommendations: rankings
    });
  } catch (err) {
    return next(err);
  }
});

dispatchRouter.post("/:loadId/assign/:driverId", requireScope("dispatch.assign"), async (req, res, next) => {
  try {
    const organizationId = req.auth!.organizationId;
    const { loadId, driverId } = req.params;

    const [load, driver] = await Promise.all([
      prisma.load.findFirst({ where: { id: loadId, organizationId } }),
      prisma.driver.findFirst({
        where: { id: driverId, organizationId },
        include: { truck: true }
      })
    ]);

    if (!load || !driver) {
      return res.status(404).json({ error: "Load or driver not found" });
    }

    await prisma.load.update({
      where: { id: load.id },
      data: {
        driverId: driver.id,
        status: "ASSIGNED"
      }
    });

    return res.json({
      success: true,
      loadId,
      driverId
    });
  } catch (err) {
    return next(err);
  }
});
