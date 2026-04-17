import type { Shipment } from "@infamous-freight/shared";
import { SHIPMENT_STATUSES } from "@infamous-freight/shared";
import { prisma } from "../db/prisma.js";

const SHIPMENT_TRANSITIONS: Record<string, readonly string[]> = {
  CREATED: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function listShipments(tenantId: string): Promise<Shipment[]> {
  const rows = await prisma.shipment.findMany({
    where: { userId: tenantId },
    orderBy: { createdAt: "desc" }
  });

  return rows.map((r) => ({
    id: r.id,
    tenantId,
    ref: r.reference ?? r.trackingId,
    originCity: r.origin,
    originState: "",
    destCity: r.destination,
    destState: "",
    weightLb: 0,
    rateCents: 0,
    status: r.status as Shipment["status"],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }));
}

export async function updateShipmentStatus(tenantId: string, shipmentId: string, status: Shipment["status"]) {
  const s = await prisma.shipment.findFirst({ where: { id: shipmentId, userId: tenantId } });
  if (!s) throw new Error("Shipment not found");

  if (!SHIPMENT_STATUSES.includes(status)) {
    throw new Error(`Invalid shipment status: ${status}`);
  }

  if (s.status !== status) {
    const validNext = SHIPMENT_TRANSITIONS[s.status] || [];
    if (!validNext.includes(status)) {
      throw new Error(`Invalid status transition from ${s.status} to ${status}`);
    }
  }

  const result = await prisma.shipment.updateMany({
    where: { id: shipmentId, userId: tenantId },
    data: { status: status as any }
  });

  if (result.count === 0) {
    throw new Error("Shipment not found");
  }

  return prisma.shipment.findFirst({ where: { id: shipmentId, userId: tenantId } });
}
