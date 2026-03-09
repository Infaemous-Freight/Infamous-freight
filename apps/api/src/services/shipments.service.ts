import type { Shipment } from "@infamous-freight/shared";
import { prisma } from "../db/prisma.js";

export async function listShipments(tenantId: string): Promise<Shipment[]> {
  const rows = await prisma.shipment.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    ref: r.ref,
    originCity: r.originCity,
    originState: r.originState,
    destCity: r.destCity,
    destState: r.destState,
    weightLb: r.weightLb,
    rateCents: r.rateCents,
    status: r.status as Shipment["status"],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }));
}

export async function updateShipmentStatus(tenantId: string, shipmentId: string, status: Shipment["status"]) {
  const s = await prisma.shipment.findFirst({ where: { id: shipmentId, tenantId } });
  if (!s) throw new Error("Shipment not found");

  const result = await prisma.shipment.updateMany({
    where: { id: shipmentId, tenantId },
    data: { status }
  });

  if (result.count === 0) {
    throw new Error("Shipment not found");
  }

  return prisma.shipment.findFirst({ where: { id: shipmentId, tenantId } });
}
