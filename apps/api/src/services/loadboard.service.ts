import type { Load } from "@infamous/shared";
import { prisma } from "../db/prisma.js";

export async function listLoads(tenantId: string): Promise<Load[]> {
  const rows = await prisma.load.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    lane: `${r.originCity}, ${r.originState} → ${r.destCity}, ${r.destState}`,
    originCity: r.originCity,
    originState: r.originState,
    destCity: r.destCity,
    destState: r.destState,
    distanceMi: r.distanceMi,
    weightLb: r.weightLb,
    rateCents: r.rateCents,
    status: r.status as any,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }));
}

export async function claimLoad(tenantId: string, loadId: string) {
  const load = await prisma.load.findFirst({ where: { id: loadId, tenantId } });
  if (!load) throw new Error("Load not found");
  if (load.status !== "OPEN") throw new Error("Load not open");

  await prisma.load.updateMany({
    where: { id: loadId, tenantId },
    data: { status: "CLAIMED" }
  });

  return { ...load, status: "CLAIMED" };
}
