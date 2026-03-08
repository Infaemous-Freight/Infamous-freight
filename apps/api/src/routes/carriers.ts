import { Router } from "express";
import { z } from "zod";
import { CarrierIntelligenceService } from "../services/carrier-intelligence.service.js";
import type { CarrierProfile } from "../types/domain.js";

const router = Router();
const service = new CarrierIntelligenceService();

router.post("/rank", (req, res) => {
  const body = z
    .object({
      lane: z.object({
        origin: z.string(),
        destination: z.string(),
        distanceMiles: z.number().positive()
      }),
      equipmentType: z.enum(["VAN", "REEFER", "FLATBED"]),
      carriers: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          onTimeRate: z.number().min(0).max(1),
          tenderAcceptanceRate: z.number().min(0).max(1),
          safetyScore: z.number().min(0).max(1),
          priceCompetitiveness: z.number().min(0).max(1),
          serviceRating: z.number().min(0).max(1),
          equipmentTypes: z.array(z.enum(["VAN", "REEFER", "FLATBED"])),
          activeLanes: z.array(z.string())
        })
      )
    })
    .parse(req.body);

  const ranked = service.rankCarriersForLane(
    body.carriers as CarrierProfile[],
    body.lane,
    body.equipmentType
  );

  res.json({ ok: true, data: ranked });
});

export default router;
