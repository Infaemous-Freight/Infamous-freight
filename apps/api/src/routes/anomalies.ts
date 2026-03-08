import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireScope } from "../middleware/requireScope.js";
import { GpsAnomalyService } from "../services/anomalies/gps-anomaly.service.js";

export const anomaliesRouter = Router();
const gpsService = new GpsAnomalyService();

anomaliesRouter.post("/gps/:driverId/evaluate", requireScope("anomaly.evaluate"), async (req, res) => {
  const organizationId = req.auth!.organizationId;
  const { driverId } = req.params;

  const pings = await prisma.gpsPing.findMany({
    where: { driverId, organizationId },
    orderBy: { recordedAt: "asc" },
    take: 20
  });

  if (pings.length === 0) {
    return res.status(404).json({ error: "No GPS pings found" });
  }

  const lastPing = pings[pings.length - 1]!;
  const signalLoss = gpsService.detectGpsSignalLoss(lastPing.recordedAt);
  const suspiciousStop = gpsService.detectSuspiciousStop(pings);

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

  return res.json(results);
});
