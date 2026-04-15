import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../utils/errors.js";

const router: Router = Router();

const DRIVER_STATUS = ["AVAILABLE", "ON_DUTY", "OFF_DUTY"] as const;

const createDriverSchema = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  phone: z.string().optional(),
  status: z.enum(DRIVER_STATUS).default("AVAILABLE"),
});

const driverSelect = {
  id: true,
  tenantId: true,
  name: true,
  phone: true,
  status: true,
  email: true,
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
    const pageParam = Number(req.query.page);
    const limitParam = Number(req.query.limit);
    const page = Number.isFinite(pageParam) ? Math.max(1, Math.trunc(pageParam)) : 1;
    const limit = Number.isFinite(limitParam) ? Math.min(100, Math.max(1, Math.trunc(limitParam))) : 20;
    const drivers = await prisma.driver.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: driverSelect,
    });
    res.json({ ok: true, data: drivers, page, limit });
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
    const body = createDriverSchema.parse(req.body);
    const driver = await prisma.driver.create({
      data: { tenantId, ...body },
      select: driverSelect,
    });
    res.status(201).json({ ok: true, data: driver });
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
    const { status } = z
      .object({
        status: z.enum(DRIVER_STATUS),
      })
      .parse(req.body);
    const id = req.params.id;
    const existing = await prisma.driver.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      next(new ApiError(404, "DRIVER_NOT_FOUND", "Driver not found"));
      return;
    }
    const updated = await prisma.driver.update({
      where: { id },
      data: { status },
      select: driverSelect,
    });
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
