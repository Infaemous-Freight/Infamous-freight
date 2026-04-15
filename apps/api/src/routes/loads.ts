import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../utils/errors.js";
import { zCreateLoad } from "@infamous-freight/shared";

const router: Router = Router();

const LOAD_STATUS = ["OPEN", "CLAIMED", "ASSIGNED", "CLOSED"] as const;

// Strip tenantId — it comes from the authenticated JWT, never from request body.
const createLoadSchema = zCreateLoad.omit({ tenantId: true });

const loadSelect = {
  id: true,
  tenantId: true,
  status: true,
  originCity: true,
  originState: true,
  destCity: true,
  destState: true,
  distanceMi: true,
  weightLb: true,
  rateCents: true,
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
    const page = Number.isFinite(pageRaw) ? Math.max(1, pageRaw) : 1;
    const limitRaw = Number.parseInt(String(req.query.limit ?? "20"), 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(100, Math.max(1, limitRaw))
      : 20;
    const loads = await prisma.load.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: loadSelect,
    });
    res.json({ ok: true, data: loads, page, limit });
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
    const body = createLoadSchema.parse(req.body);
    const load = await prisma.load.create({
      data: { tenantId, ...body },
      select: loadSelect,
    });
    res.status(201).json({ ok: true, data: load });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: "Tenant context required" });
      return;
    }
    const { status } = z.object({ status: z.enum(LOAD_STATUS) }).parse(req.body);
    const id = req.params.id;
    const load = await prisma.load.findFirst({ where: { id, tenantId } });
    if (!load) {
      next(new ApiError(404, "LOAD_NOT_FOUND", "Load not found"));
      return;
    }
    const updated = await prisma.load.update({
      where: { id },
      data: { status },
      select: loadSelect,
    });
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
