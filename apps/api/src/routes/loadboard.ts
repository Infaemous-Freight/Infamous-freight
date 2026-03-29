import { zCreateLoad, zTenantId } from "@infamous-freight/shared";
import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/prisma.js";
import { claimLoad, listLoads } from "../services/loadboard.service.js";
import { parseOrThrow } from "../utils/validate.js";

export const loadboard: Router = Router();

/**
 * Lists available loads for the authenticated tenant.
 *
 * Security:
 * - Requires authentication.
 * - Restricts the query to `auth.tenantId`.
 */
loadboard.get("/", requireAuth, async (req, res, next) => {
  try {
    const tenantId = zTenantId.parse((req as any).auth.tenantId);
    res.json({ data: await listLoads(tenantId) });
  } catch (e) {
    next(e);
  }
});

/**
 * Creates a new load under the authenticated tenant.
 *
 * Security:
 * - Requires authentication.
 * - Writes only inside `auth.tenantId` scope.
 */
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
        rateCents: body.rateCents,
      },
    });
    res.status(201).json({ id: row.id });
  } catch (e) {
    next(e);
  }
});

/**
 * Attempts to atomically claim an OPEN load for the authenticated tenant.
 * Returns HTTP 409 if the load is already claimed or unavailable.
 */
loadboard.post("/:id/claim", requireAuth, async (req, res, next) => {
  try {
    const tenantId = zTenantId.parse((req as any).auth.tenantId);
    const userId = (req as any).auth?.sub;
    if (typeof userId !== "string" || userId.length === 0) {
      return res.status(401).json({ error: "Invalid authentication token." });
    }
    const claimed = await claimLoad(tenantId, req.params.id as string, userId);

    if (!claimed) {
      return res.status(409).json({ error: "Load already claimed or not available." });
    }

    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});
