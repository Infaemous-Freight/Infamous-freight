import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../utils/errors.js";
import { EtaRiskService } from "../services/eta-risk.service.js";
import { zCreateShipment } from "@infamous-freight/shared";
import { randomUUID } from "node:crypto";

const router: Router = Router();
const etaService = new EtaRiskService();

const SHIPMENT_STATUSES = [
  "CREATED",
  "POSTED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
] as const;

const createShipmentSchema = zCreateShipment.omit({ tenantId: true });

const shipmentSelect = {
  id: true,
  tenantId: true,
  trackingId: true,
  userId: true,
  driverId: true,
  origin: true,
  destination: true,
  status: true,
  reference: true,
  createdAt: true,
  updatedAt: true,
} as const;

// GET /api/shipments — list tenant shipments (paginated)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const tenantId = user?.tenantId;
    if (!tenantId) {
      next(new ApiError(401, "TENANT_REQUIRED", "Tenant context required"));
      return;
    }
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const shipments = await prisma.shipment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: shipmentSelect,
    });
    res.json({ ok: true, data: shipments, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /api/shipments/:id — get single shipment
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const tenantId = user?.tenantId;
    if (!tenantId) {
      next(new ApiError(401, "TENANT_REQUIRED", "Tenant context required"));
      return;
    }
    const shipment = await prisma.shipment.findFirst({
      where: { id: req.params.id, tenantId },
      select: shipmentSelect,
    });
    if (!shipment) {
      next(new ApiError(404, "NOT_FOUND", "Shipment not found"));
      return;
    }
    res.json({ ok: true, data: shipment });
  } catch (err) {
    next(err);
  }
});

// POST /api/shipments — create shipment
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const tenantId = user?.tenantId;
    const userId = user?.id;
    if (!tenantId || !userId) {
      next(new ApiError(401, "TENANT_REQUIRED", "Tenant context required"));
      return;
    }
    const body = createShipmentSchema.parse(req.body);
    const shipment = await prisma.shipment.create({
      data: {
        tenantId,
        userId,
        trackingId: randomUUID(),
        origin: body.origin,
        destination: body.destination,
        reference: body.reference,
        driverId: body.driverId,
      },
      select: shipmentSelect,
    });
    res.status(201).json({ ok: true, data: shipment });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/shipments/:id/status — update shipment status
router.patch("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const tenantId = user?.tenantId;
    if (!tenantId) {
      next(new ApiError(401, "TENANT_REQUIRED", "Tenant context required"));
      return;
    }
    const { status } = z.object({ status: z.enum(SHIPMENT_STATUSES) }).parse(req.body);
    const existing = await prisma.shipment.findFirst({
      where: { id: req.params.id, tenantId },
    });
    if (!existing) {
      next(new ApiError(404, "NOT_FOUND", "Shipment not found"));
      return;
    }
    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status },
      select: shipmentSelect,
    });
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/shipments/eta-risk — ETA risk prediction
router.post("/eta-risk", requireAuth, (req, res, next) => {
  try {
    const body = z
      .object({
        distanceRemainingMiles: z.number().nonnegative(),
        averageSpeedMph: z.number().positive(),
        weatherRisk: z.number().min(0).max(1),
        trafficRisk: z.number().min(0).max(1),
        carrierReliability: z.number().min(0).max(1),
      })
      .parse(req.body);

    const result = etaService.predict(body);
    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
