import { zCreateLoad, zTenantId } from "@infamous/shared";
import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/prisma.js";
import { claimLoad, listLoads } from "../services/loadboard.service.js";
import { parseOrThrow } from "../utils/validate.js";

export const loadboard = Router();

loadboard.get("/", requireAuth, async (req, res, next) => {
  try {
    const tenantId = zTenantId.parse((req as any).auth.tenantId);
    res.json({ data: await listLoads(tenantId) });
  } catch (e) {
    next(e);
  }
});

loadboard.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = parseOrThrow(zCreateLoad, req.body);
    const tenantId = zTenantId.parse((req as any).auth.tenantId);
    const row = await prisma.load.create({
      data: {
        tenantId,
        originCity: body.originCity,
        originState: body.originState,
        destCity: body.destCity,
        destState: body.destState,
        distanceMi: body.distanceMi,
        weightLb: body.weightLb,
        rateCents: body.rateCents
      }
    });
    res.status(201).json({ id: row.id });
  } catch (e) {
    next(e);
  }
});

loadboard.post("/:id/claim", requireAuth, async (req, res, next) => {
  try {
    const tenantId = zTenantId.parse((req as any).auth.tenantId);
    await claimLoad(tenantId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
