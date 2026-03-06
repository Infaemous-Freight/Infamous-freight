import { prisma } from "./db/prisma.js";
import { createPrismaSessionStore } from "@infamous/genesis";

/**
 * Creates a Genesis runtime surface for the authenticated user.
 */
export function makeGenesis(auth: { tenantId: string; sub: string; role: string }) {
  const sessionStore = createPrismaSessionStore(prisma as any, 25);

  return {
    sessionStore,
    auth,
    alerts: {
      /**
       * Returns shipment telemetry for non-delivered shipments in this tenant.
       */
      async getShipmentTelemetry() {
        const nowMs = Date.now();

        const rows = await (prisma as any).shipment.findMany({
          where: {
            tenantId: auth.tenantId,
            status: { not: "DELIVERED" }
          },
          take: 250,
          orderBy: { updatedAt: "desc" },
          select: { id: true, status: true, etaMs: true, lastPingMs: true }
        });

        return rows.map((s: any) => ({
          shipmentId: s.id,
          status: s.status,
          etaMs: s.etaMs != null ? Number(s.etaMs) : undefined,
          lastPingMs: s.lastPingMs != null ? Number(s.lastPingMs) : undefined,
          nowMs
        }));
      }
    }
  };
}
