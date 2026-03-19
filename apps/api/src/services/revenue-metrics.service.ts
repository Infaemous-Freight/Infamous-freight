import { prisma } from "../db/prisma.js";

export class RevenueMetricsService {
  async getTenantMetrics(tenantId: string) {
    const shipments = await prisma.shipment.findMany({
      where: { tenantId }
    });

    const revenueCents = shipments.reduce((sum, shipment) => sum + shipment.rateCents, 0);
    const avgRateCents = shipments.length ? Math.round(revenueCents / shipments.length) : 0;

    const byLane = shipments.reduce<Record<string, number>>((acc, shipment) => {
      const lane = `${shipment.originCity},${shipment.originState} -> ${shipment.destCity},${shipment.destState}`;
      acc[lane] = (acc[lane] ?? 0) + shipment.rateCents;
      return acc;
    }, {});

    return {
      shipmentCount: shipments.length,
      revenueCents,
      avgRateCents,
      topLanes: Object.entries(byLane)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lane, totalRateCents]) => ({ lane, totalRateCents }))
    };
  }
}
