import prisma from "./lib/prisma.js";
import { createPrismaSessionStore } from "../../packages/genesis/dist/memory/adapters/prismaSessionStore.js";

export function makeGenesis(auth: { tenantId: string; sub: string; role: string }) {
  const sessionStore = createPrismaSessionStore(prisma as any, 25);

  return {
    sessionStore,
    alerts: {
      async getShipmentTelemetry() {
        const nowMs = Date.now();
        const rows = await (prisma as any).shipment.findMany({
          where: {
            user: { organizationId: auth.tenantId },
            status: { not: "DELIVERED" }
          },
          take: 250,
          orderBy: { updatedAt: "desc" }
        });

        return rows.map((s: any) => ({
          shipmentId: s.id,
          status: s.status,
          etaMs: s.etaMs ? Number(s.etaMs) : undefined,
          nowMs,
          lastPingMs: s.lastPingMs ? Number(s.lastPingMs) : undefined
        }));
      }
    },
    auth
  };
}
