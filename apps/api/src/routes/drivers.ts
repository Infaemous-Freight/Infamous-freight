import { Router } from "express";
import { z } from "zod";
import { getRequiredTenantId, requireAnyRole, requireAuth, requireTenantContext } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";

const router: Router = Router();

const tenantRouteRoles = ["owner", "admin", "dispatcher", "shipper", "user"];

const createDriverSchema = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  phone: z.string().optional(),
  status: z.enum(["AVAILABLE", "ON_DUTY", "OFF_DUTY"]).default("AVAILABLE"),
});

router.get("/", requireAuth, requireTenantContext, requireAnyRole(tenantRouteRoles), async (req, res, next) => {
  try {
    const tenantId = getRequiredTenantId(req);
    const drivers = await prisma.driver.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
    res.json({ ok: true, data: drivers });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireTenantContext, requireAnyRole(tenantRouteRoles), async (req, res, next) => {
  try {
    const tenantId = getRequiredTenantId(req);
    const body = createDriverSchema.parse(req.body);
    const driver = await prisma.driver.create({
      data: { tenantId, ...body },
    });
    res.status(201).json({ ok: true, data: driver });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", requireAuth, requireTenantContext, requireAnyRole(tenantRouteRoles), async (req, res, next) => {
  try {
    const tenantId = getRequiredTenantId(req);
    const { status } = z
      .object({
        status: z.enum(["AVAILABLE", "ON_DUTY", "OFF_DUTY"]),
      })
      .parse(req.body);
    const id = req.params.id as string;
    const existing = await prisma.driver.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      res.status(404).json({ error: "Driver not found" });
      return;
    }
    const updated = await prisma.driver.update({
      where: { id },
      data: { status },
    });
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
