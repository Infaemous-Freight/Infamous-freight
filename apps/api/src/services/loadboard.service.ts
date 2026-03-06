import type { Load } from "@infamous/shared";
import { prisma } from "../db/prisma.js";

/**
 * Lists loads scoped to a single tenant in reverse chronological order.
 */
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
    claimedByUserId: r.claimedByUserId ?? undefined,
    claimedAt: r.claimedAt ? r.claimedAt.toISOString() : undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }));
}

/**
 * Atomically claims an OPEN load in tenant scope.
 *
 * Returns true if the claim succeeds and false if another claimant already won.
 */
export async function claimLoad(tenantId: string, loadId: string, userId?: string) {
  const updated = await prisma.load.updateMany({
    where: {
      id: loadId,
      tenantId,
      status: "OPEN",
      claimedByUserId: null
    },
    data: {
      status: "CLAIMED",
      claimedByUserId: userId ?? null,
      claimedAt: new Date()
    }
  });

  return updated.count > 0;
}
