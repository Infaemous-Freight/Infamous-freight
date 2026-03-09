import type { Request, Response, NextFunction } from "express";
import {
  listShipments,
  updateShipmentStatus,
} from "../services/shipments.service.js";
import type { Shipment } from "@infamous/shared";

/**
 * GET /shipments
 * Lists all shipments scoped to the authenticated tenant.
 */
export async function getShipments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenantId: string = (req as any).tenantId;
    const shipments = await listShipments(tenantId);
    res.json({ ok: true, data: shipments });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /shipments/:id/status
 * Updates the status of a shipment within the authenticated tenant.
 */
export async function patchShipmentStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tenantId: string = (req as any).tenantId;
    const { id } = req.params;
    const { status } = req.body as { status: Shipment["status"] };
    const updated = await updateShipmentStatus(tenantId, id, status);
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}
