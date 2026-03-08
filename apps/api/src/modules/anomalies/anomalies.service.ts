import { writeAuditLog } from "../../lib/audit.js";
import { prisma } from "../../lib/prisma.js";
import { GpsAnomalyService } from "./gps-anomaly.service.js";

const gps = new GpsAnomalyService();

export class AnomaliesService {
  async evaluateDriverGps(organizationId: string, actorUserId: string, driverId: string) {
    const pings = await prisma.gpsPing.findMany({
      where: { organizationId, driverId },
      orderBy: { recordedAt: "asc" },
      take: 20
    });

    if (pings.length === 0) {
      throw new Error("No GPS pings found");
    }

    const signalLoss = gps.detectSignalLoss(pings[pings.length - 1]!.recordedAt);
    const suspiciousStop = gps.detectSuspiciousStop(pings);

    const results = { signalLoss, suspiciousStop };

    if (signalLoss.anomalous) {
      await prisma.anomaly.create({
        data: {
          organizationId,
          driverId,
          type: "GPS_SIGNAL_LOSS",
          severity: signalLoss.score > 70 ? "HIGH" : "MEDIUM",
          score: signalLoss.score,
          details: results
        }
      });
    }

    if (suspiciousStop.anomalous) {
      await prisma.anomaly.create({
        data: {
          organizationId,
          driverId,
          type: "SUSPICIOUS_STOP",
          severity: suspiciousStop.score > 70 ? "HIGH" : "MEDIUM",
          score: suspiciousStop.score,
          details: results
        }
      });
    }

    await writeAuditLog({
      organizationId,
      actorUserId,
      action: "anomaly.evaluated",
      entityType: "Driver",
      entityId: driverId,
      metadata: results as unknown as Record<string, unknown>
    });

    return results;
  }
}
