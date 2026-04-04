import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";
import { EtaRiskService } from "../services/eta-risk.service.js";

const router: Router = Router();
const etaService = new EtaRiskService();

router.post("/eta-risk", requireAuth, async (req, res, next) => {
  try {
    const authedReq = req as AuthenticatedRequest;
    const tenantId = authedReq.user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: "Tenant context required" });
      return;
    }

    const body = z
      .object({
        distanceRemainingMiles: z.number().nonnegative(),
        averageSpeedMph: z.number().positive(),
        weatherRisk: z.number().min(0).max(1),
        trafficRisk: z.number().min(0).max(1),
        carrierReliability: z.number().min(0).max(1),
      })
      .parse(req.body);

    const result = etaService.predict(body);

    await prisma.aiDecisionLog.create({
      data: {
        tenantId,
        entityType: "SHIPMENT",
        entityId: `eta-risk:${new Date().toISOString()}`,
        module: "PREDICTIVE_OPERATIONS",
        decision: result.riskBand,
        confidence: 1 - result.delayProbability,
        reasonCodes: ["ETA_RISK_SCORING"],
        inputSnapshot: body,
        outputSnapshot: result,
      },
    });

    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
