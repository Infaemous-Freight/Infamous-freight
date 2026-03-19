import { db } from "../lib/db.js";

export class AgentOrchestrator {
  async dispatch(tenantId: string, shipmentId: string) {
    const carriers = await db.driver.findMany({
      where: { tenantId }
    });

    if (!carriers.length) return null;

    const best = carriers[0];

    return db.dispatch.create({
      data: {
        tenantId,
        loadId: shipmentId,
        driverId: best.id
      }
    });
  }

  async pricing(tenantId: string, shipmentId: string) {
    const shipment = await db.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) return null;

    const newRate = shipment.rateCents + 1000;

    return db.shipment.update({
      where: { id: shipmentId },
      data: { rateCents: newRate }
    });
  }

  async delayRisk(tenantId: string, shipmentId: string) {
    const shipment = await db.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) return null;

    const risk = Math.random();

    if (risk > 0.8) {
      console.log(`High delay risk for ${shipment.ref}`);
    }

    return { risk };
  }
}
