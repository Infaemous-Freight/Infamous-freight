import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/middleware.js";
import { sseBroadcast } from "../realtime/sse.js";

/**
 * Shipment assignment routes:
 * - Create assignment (transaction: assignment + shipment status)
 * - Update assignment status (transaction: assignment + shipment status)
 */
export const assignments = Router();

const ALLOWED = ["ASSIGNED", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "CANCELLED"] as const;
type AllowedStatus = (typeof ALLOWED)[number];

/**
 * POST /assignments
 * Creates a tenant-scoped assignment and syncs shipment status.
 */
assignments.post("/", requireAuth as any, async (req, res, next) => {
  try {
    const tenantId = String((req as any).auth?.tenantId ?? "");
    const assignedBy = String((req as any).auth?.sub ?? "");
    if (!tenantId || !assignedBy) return res.status(401).json({ error: "Unauthorized" });

    const shipmentId = String(req.body?.shipmentId ?? "");
    if (!shipmentId) return res.status(400).json({ error: "Missing shipmentId" });

    const shipment = await (prisma as any).shipment.findFirst({
      where: { id: shipmentId, tenantId },
      select: { id: true, status: true }
    });
    if (!shipment) return res.status(404).json({ error: "Shipment not found" });

    const { assignment } = await (prisma as any).$transaction(async (tx: any) => {
      const assignmentRow = await tx.shipmentAssignment.create({
        data: {
          tenantId,
          shipmentId,
          loadId: req.body?.loadId ?? null,
          carrierId: req.body?.carrierId ?? null,
          driverId: req.body?.driverId ?? null,
          assignedBy,
          status: "ASSIGNED"
        }
      });

      await tx.shipment.update({
        where: { id: shipmentId },
        data: { status: "ASSIGNED" }
      });

      return { assignment: assignmentRow };
    });

    sseBroadcast(tenantId, "assignment.created", { id: assignment.id, shipmentId });
    sseBroadcast(tenantId, "shipment.updated", { shipmentId, status: "ASSIGNED" });

    res.status(201).json({ id: assignment.id });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /assignments/:id/status
 * Updates assignment status and syncs shipment status (tenant-scoped).
 */
assignments.patch("/:id/status", requireAuth as any, async (req, res, next) => {
  try {
    const tenantId = String((req as any).auth?.tenantId ?? "");
    if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

    const status = String(req.body?.status ?? "").toUpperCase() as AllowedStatus;
    if (!ALLOWED.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const assignment = await (prisma as any).shipmentAssignment.findFirst({
      where: { id: req.params.id, tenantId },
      select: { id: true, shipmentId: true }
    });
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const shipment = await (prisma as any).shipment.findFirst({
      where: { id: assignment.shipmentId, tenantId },
      select: { id: true }
    });
    if (!shipment) return res.status(404).json({ error: "Shipment not found" });

    await (prisma as any).$transaction(async (tx: any) => {
      await tx.shipmentAssignment.update({
        where: { id: assignment.id },
        data: { status }
      });

      await tx.shipment.update({
        where: { id: assignment.shipmentId },
        data: { status }
      });
    });

    sseBroadcast(tenantId, "assignment.updated", { id: assignment.id, status });
    sseBroadcast(tenantId, "shipment.updated", { shipmentId: assignment.shipmentId, status });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
