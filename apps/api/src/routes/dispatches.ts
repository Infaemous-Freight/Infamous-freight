import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";

const router: Router = Router();

const createDispatchSchema = z.object({
  loadId: z.string().min(1),
  driverId: z.string().min(1),
  notes: z.string().optional(),
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? "";
    const dispatches = await prisma.dispatch.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, data: dispatches });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? "";
    const body = createDispatchSchema.parse(req.body);
    const dispatch = await prisma.dispatch.create({
      data: { tenantId, ...body },
    });
    res.status(201).json({ ok: true, data: dispatch });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? "";
    const { status } = z.object({ status: z.string() }).parse(req.body);
    const id = req.params.id as string;
    const existing = await prisma.dispatch.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      res.status(404).json({ error: "Dispatch not found" });
      return;
    }
    const updated = await prisma.dispatch.update({
      where: { id },
      data: { status },
    });
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
