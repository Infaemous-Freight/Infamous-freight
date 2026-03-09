import type { Request, Response, NextFunction } from "express";
import { listLoads, claimLoad } from "../services/loadboard.service.js";

/**
 * GET /loadboard
 * Returns all open loads scoped to the authenticated tenant.
 */
export async function getLoads(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenantId: string = (req as any).tenantId;
    const loads = await listLoads(tenantId);
    res.json({ ok: true, data: loads });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /loadboard/:id/claim
 * Claims an open load for the authenticated user within the tenant.
 */
export async function postClaimLoad(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenantId: string = (req as any).tenantId;
    const userId: string = (req as any).userId;
    const { id } = req.params;
    const claimed = await claimLoad(tenantId, id, userId);
    if (!claimed) {
      res.status(409).json({ ok: false, error: "Load already claimed" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
