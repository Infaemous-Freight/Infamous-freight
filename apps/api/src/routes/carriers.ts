import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { CarrierIntelligenceService } from "../services/carrier-intelligence.service.js";
import type { CarrierProfile } from "../types/domain.js";

const router: Router = Router();
const service = new CarrierIntelligenceService();

const createCarrierSchema = z.object({
  companyName: z.string().min(1),
  mcNumber: z.string().min(1),
  dotNumber: z.string().optional(),
});

const updateCarrierSchema = z.object({
  companyName: z.string().min(1).optional(),
  mcNumber: z.string().min(1).optional(),
  dotNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const carriers = await prisma.carrier.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { companyName: "asc" },
    });
    res.json({ ok: true, data: carriers });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    if (!user.tenantId) {
      res.status(401).json({ error: "Tenant context required" });
      return;
    }
    const { companyName, mcNumber, dotNumber } = createCarrierSchema.parse(req.body);
    const carrier = await prisma.carrier.create({
      data: { tenantId: user.tenantId, companyName, mcNumber, dotNumber },
    });
    res.status(201).json({ ok: true, data: carrier });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const carrier = await prisma.carrier.findFirst({
      where: { id: req.params.id, tenantId: user.tenantId },
    });
    if (!carrier) {
      res.status(404).json({ ok: false, error: "Carrier not found" });
      return;
    }
    res.json({ ok: true, data: carrier });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const existing = await prisma.carrier.findFirst({
      where: { id: req.params.id, tenantId: user.tenantId },
    });
    if (!existing) {
      res.status(404).json({ ok: false, error: "Carrier not found" });
      return;
    }
    const updates = updateCarrierSchema.parse(req.body);
    const carrier = await prisma.carrier.update({
      where: { id: req.params.id },
      data: updates,
    });
    res.json({ ok: true, data: carrier });
  } catch (err) {
    next(err);
  }
});

router.post("/rank", requireAuth, (req, res) => {
  const body = z
    .object({
      lane: z.object({
        origin: z.string(),
        destination: z.string(),
        distanceMiles: z.number().positive(),
      }),
      equipmentType: z.enum(["VAN", "REEFER", "FLATBED"]),
      carriers: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          onTimeRate: z.number().min(0).max(1),
          tenderAcceptanceRate: z.number().min(0).max(1),
          safetyScore: z.number().min(0).max(1),
          priceCompetitiveness: z.number().min(0).max(1),
          serviceRating: z.number().min(0).max(1),
          equipmentTypes: z.array(z.enum(["VAN", "REEFER", "FLATBED"])),
          activeLanes: z.array(z.string()),
        }),
      ),
    })
    .parse(req.body);

  const ranked = service.rankCarriersForLane(
    body.carriers as CarrierProfile[],
    body.lane,
    body.equipmentType,
  );

  res.json({ ok: true, data: ranked });
});

export default router;
