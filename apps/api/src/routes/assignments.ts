import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/security.js";
import { sseBroadcast } from "../realtime/sse.js";

export const assignments = Router();

assignments.post("/", authenticate as any, async (req, res, next) => {
  try {
    const tenantId = String((req as any).auth?.organizationId ?? "");
    const assignedBy = String((req as any).auth?.userId ?? "");
    const shipmentId = String(req.body?.shipmentId ?? "");

    if (!shipmentId) return res.status(400).json({ error: "Missing shipmentId" });

    const shipment = await (prisma as any).shipment.findFirst({ where: { id: shipmentId } });
    if (!shipment) return res.status(404).json({ error: "Shipment not found" });

    const row = await (prisma as any).shipmentAssignment.create({
      data: {
        organizationId: tenantId,
        shipmentId,
        loadId: req.body?.loadId ?? null,
        carrierId: req.body?.carrierId ?? null,
        driverId: req.body?.driverId ?? null,
        assignedBy,
        status: "ASSIGNED"
      }
    });

    await (prisma as any).shipment.update({ where: { id: shipmentId }, data: { status: "ASSIGNED" } });

    sseBroadcast(tenantId, "assignment.created", { id: row.id, shipmentId });
    res.status(201).json({ id: row.id });
  } catch (e) {
    next(e);
  }
});

assignments.patch("/:id/status", authenticate as any, async (req, res, next) => {
  try {
    const tenantId = String((req as any).auth?.organizationId ?? "");
    const status = String(req.body?.status ?? "").toUpperCase();
    const allowed = ["ASSIGNED", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const row = await (prisma as any).shipmentAssignment.findFirst({ where: { id: req.params.id, organizationId: tenantId } });
    if (!row) return res.status(404).json({ error: "Assignment not found" });

    await (prisma as any).shipmentAssignment.update({ where: { id: row.id }, data: { status } });
    await (prisma as any).shipment.update({ where: { id: row.shipmentId }, data: { status } });

    sseBroadcast(tenantId, "assignment.updated", { id: row.id, status });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
