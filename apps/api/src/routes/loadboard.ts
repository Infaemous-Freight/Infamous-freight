import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/middleware.js";
import { sseBroadcast } from "../realtime/sse.js";

/**
 * Loadboard routes:
 * - Paginated tenant-scoped search
 * - Atomic claim with conflict guard
 */
export const loadboard = Router();

/**
 * GET /loadboard
 * Query loads for the authenticated tenant.
 */
loadboard.get("/", requireAuth as any, async (req, res, next) => {
  try {
    const tenantId = String((req as any).auth?.tenantId ?? "");
    if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25)));
    const skip = (page - 1) * pageSize;

    const q = String(req.query.q ?? "").trim();
    const originState = String(req.query.originState ?? "").trim();
    const destState = String(req.query.destState ?? "").trim();
    const status = String(req.query.status ?? "").trim().toUpperCase();

    const where: any = { tenantId };
    if (status) where.status = status;
    if (originState) where.originState = originState;
    if (destState) where.destState = destState;

    if (q) {
      where.OR = [
        { originCity: { contains: q, mode: "insensitive" } },
        { destCity: { contains: q, mode: "insensitive" } }
      ];
    }

    const [total, rows] = await Promise.all([
      (prisma as any).load.count({ where }),
      (prisma as any).load.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      })
    ]);

    res.json({ page, pageSize, total, data: rows });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /loadboard/:id/claim
 * Atomically claims an OPEN load for the authenticated user.
 */
loadboard.post("/:id/claim", requireAuth as any, async (req, res, next) => {
  try {
    const tenantId = String((req as any).auth?.tenantId ?? "");
    const userId = String((req as any).auth?.sub ?? "");
    if (!tenantId || !userId) return res.status(401).json({ error: "Unauthorized" });

    const load = await (prisma as any).load.findFirst({
      where: { id: req.params.id, tenantId }
    });
    if (!load) return res.status(404).json({ error: "Load not found" });

    const result = await (prisma as any).load.updateMany({
      where: {
        id: load.id,
        tenantId,
        status: "OPEN",
        claimedByUserId: null
      },
      data: {
        status: "CLAIMED",
        claimedByUserId: userId,
        claimedAt: new Date()
      }
    });

    if (result.count === 0) {
      return res.status(409).json({ error: "Load already claimed or not OPEN" });
    }

    sseBroadcast(tenantId, "load.updated", {
      id: load.id,
      status: "CLAIMED",
      claimedByUserId: userId
    });

    res.json({ ok: true, id: load.id });
  } catch (e) {
    next(e);
  }
});
