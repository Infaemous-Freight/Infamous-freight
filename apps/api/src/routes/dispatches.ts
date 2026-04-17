import { Router } from "express";
import { z } from "zod";
import { getRequiredTenantId, requireAnyRole, requireAuth, requireTenantContext } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";

const router: Router = Router();

const tenantRouteRoles = ["owner", "admin", "dispatcher", "shipper", "user"];

const createDispatchSchema = z.object({
  loadId: z.string().min(1),
  driverId: z.string().min(1),
  notes: z.string().optional(),
});

router.get("/", requireAuth, requireTenantContext, requireAnyRole(tenantRouteRoles), async (req, res, next) => {
  try {
    const tenantId = getRequiredTenantId(req);
    const dispatches = await prisma.dispatch.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, data: dispatches });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireTenantContext, requireAnyRole(tenantRouteRoles), async (req, res, next) => {
  try {
    const tenantId = getRequiredTenantId(req);
    const body = createDispatchSchema.parse(req.body);
    const dispatch = await prisma.dispatch.create({
      data: { tenantId, ...body },
    });
    res.status(201).json({ ok: true, data: dispatch });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, requireTenantContext, requireAnyRole(tenantRouteRoles), async (req, res, next) => {
  try {
    const tenantId = getRequiredTenantId(req);
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
