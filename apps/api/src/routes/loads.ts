import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireScope } from "../middleware/requireScope.js";

export const loadsRouter = Router();

loadsRouter.get("/", requireScope("load.read"), async (req, res) => {
  const organizationId = req.auth!.organizationId;

  const loads = await prisma.load.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      driver: true,
      carrier: true,
      routePlan: true
    }
  });

  return res.json(loads);
});

loadsRouter.post("/", requireScope("load.create"), async (req, res) => {
  const organizationId = req.auth!.organizationId;

  const load = await prisma.load.create({
    data: {
      organizationId,
      referenceNumber: req.body.referenceNumber,
      originLat: req.body.originLat,
      originLng: req.body.originLng,
      destinationLat: req.body.destinationLat,
      destinationLng: req.body.destinationLng,
      pickupWindowStart: new Date(req.body.pickupWindowStart),
      pickupWindowEnd: new Date(req.body.pickupWindowEnd),
      deliveryDeadline: new Date(req.body.deliveryDeadline),
      weightLbs: req.body.weightLbs,
      hazmat: req.body.hazmat ?? false,
      trailerType: req.body.trailerType
    }
  });

  return res.status(201).json(load);
});
