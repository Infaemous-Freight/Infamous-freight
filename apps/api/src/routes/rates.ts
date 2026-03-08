import { Router } from "express";
import { z } from "zod";
import { RatePredictionService } from "../services/rate-prediction.service.js";

const router = Router();
const service = new RatePredictionService();

router.post("/predict", (req, res) => {
  const body = z
    .object({
      lane: z.object({
        origin: z.string(),
        destination: z.string(),
        distanceMiles: z.number().positive()
      }),
      equipmentType: z.enum(["VAN", "REEFER", "FLATBED"]),
      fuelPriceUsdPerGallon: z.number().positive(),
      seasonalityIndex: z.number().positive(),
      marketCapacityIndex: z.number().positive(),
      demandIndex: z.number().positive(),
      historicalSpotRatePerMile: z.number().positive()
    })
    .parse(req.body);

  const result = service.predict(body);
  res.json({ ok: true, data: result });
});

export default router;
