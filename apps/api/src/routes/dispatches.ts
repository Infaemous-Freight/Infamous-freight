import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../utils/errors.js";

const router: Router = Router();

const DISPATCH_STATUS = ["PENDING", "ASSIGNED", "EN_ROUTE", "COMPLETED", "CANCELLED"] as const;

const createDispatchSchema = z.object({
  loadId: z.string().min(1),
  driverId: z.string().min(1),
  notes: z.string().optional(),
});

const dispatchSelect = {
  id: true,
  tenantId: true,
  loadId: true,
  driverId: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: "Tenant context required" });
      return;
    }
    const pageRaw = Number.parseInt(String(req.query.page ?? "1"), 10);
    const limitRaw = Number.parseInt(String(req.query.limit ?? "20"), 10);
    const page = Number.isNaN(pageRaw) ? 1 : Math.max(1, pageRaw);
    const limit = Number.isNaN(limitRaw) ? 20 : Math.min(100, Math.max(1, limitRaw));
    const dispatches = await prisma.dispatch.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: dispatchSelect,
    });
    res.json({ ok: true, data: dispatches, page, limit });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: "Tenant context required" });
      return;
    }
    const body = createDispatchSchema.parse(req.body);
    const dispatch = await prisma.dispatch.create({
      data: { tenantId, ...body },
      select: dispatchSelect,
    });
    res.status(201).json({ ok: true, data: dispatch });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: "Tenant context required" });
      return;
    }
    const { status } = z.object({ status: z.enum(DISPATCH_STATUS) }).parse(req.body);
    const id = req.params.id;
    const existing = await prisma.dispatch.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      next(new ApiError(404, "DISPATCH_NOT_FOUND", "Dispatch not found"));
      return;
    }
    const updated = await prisma.dispatch.update({
      where: { id },
      data: { status },
      select: dispatchSelect,
    });
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
