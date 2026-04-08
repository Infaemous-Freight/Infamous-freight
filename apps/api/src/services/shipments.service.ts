import type { Shipment } from "@infamous-freight/shared";
import { prisma } from "../db/prisma.js";

export async function listShipments(tenantId: string): Promise<Shipment[]> {
  const rows = await prisma.shipment.findMany({
    where: { userId: tenantId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r: any) => ({
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
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function updateShipmentStatus(
  tenantId: string,
  shipmentId: string,
  status: Shipment["status"],
) {
  const s = await prisma.shipment.findFirst({ where: { id: shipmentId, userId: tenantId } });
  if (!s) throw new Error("Shipment not found");

  const result = await prisma.shipment.updateMany({
    where: { id: shipmentId, userId: tenantId },
    data: { status: status as any },
  });

  if (result.count === 0) {
    throw new Error("Shipment not found");
  }

  return prisma.shipment.findFirst({ where: { id: shipmentId, userId: tenantId } });
}
