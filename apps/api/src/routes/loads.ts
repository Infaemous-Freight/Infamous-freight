import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireTenantContext, type AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";

const router: Router = Router();

const createLoadSchema = z.object({
  originCity: z.string().min(1),
  originState: z.string().length(2),
  destCity: z.string().min(1),
  destState: z.string().length(2),
  distanceMi: z.number().int().positive(),
  weightLb: z.number().int().positive(),
  rateCents: z.number().int().positive(),
  status: z.literal("OPEN").default("OPEN"),
});

router.get("/", requireAuth, requireTenantContext, async (req, res, next) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user!.tenantId!;
    const loads = await prisma.load.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, data: loads });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireTenantContext, async (req, res, next) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user!.tenantId!;
    const body = createLoadSchema.parse(req.body);
    const load = await prisma.load.create({ data: { tenantId, ...body } });
    res.status(201).json({ ok: true, data: load });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", requireAuth, requireTenantContext, async (req, res, next) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user!.tenantId!;
    const { status } = z.object({ status: z.string() }).parse(req.body);
    const id = req.params.id as string;
    const load = await prisma.load.findFirst({ where: { id, tenantId } });
    if (!load) {
      res.status(404).json({ error: "Load not found" });
      return;
    }
    const updated = await prisma.load.update({
      where: { id },
      data: { status },
    });
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
