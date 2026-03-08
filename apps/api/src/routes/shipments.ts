import { Router } from "express";
import { z } from "zod";
import { EtaRiskService } from "../services/eta-risk.service.js";

const router = Router();
const etaService = new EtaRiskService();

router.post("/eta-risk", (req, res) => {
  const body = z
    .object({
      distanceRemainingMiles: z.number().nonnegative(),
      averageSpeedMph: z.number().positive(),
      weatherRisk: z.number().min(0).max(1),
      trafficRisk: z.number().min(0).max(1),
      carrierReliability: z.number().min(0).max(1)
    })
    .parse(req.body);

  const result = etaService.predict(body);
  res.json({ ok: true, data: result });
});

export default router;
