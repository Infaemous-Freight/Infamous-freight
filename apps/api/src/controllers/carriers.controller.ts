import type { Request, Response } from "express";
import { rankCarriersRequestSchema } from "../models/carrier.model.js";
import { CarrierIntelligenceService } from "../services/carrier-intelligence.service.js";

const service = new CarrierIntelligenceService();

export function rankCarriers(req: Request, res: Response): void {
  const body = rankCarriersRequestSchema.parse(req.body);
  const ranked = service.rankCarriersForLane(
    body.carriers,
    body.lane,
    body.equipmentType,
  );
  res.json({ ok: true, data: ranked });
}
