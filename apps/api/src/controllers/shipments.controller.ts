import type { Request, Response } from "express";
import { etaRiskRequestSchema } from "../models/shipment.model.js";
import { EtaRiskService } from "../services/eta-risk.service.js";

const etaService = new EtaRiskService();

export function predictEtaRisk(req: Request, res: Response): void {
  const body = etaRiskRequestSchema.parse(req.body);
  const result = etaService.predict(body);
  res.json({ ok: true, data: result });
}
