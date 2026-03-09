import type { Request, Response } from "express";
import { ratePredictionRequestSchema } from "../models/rate.model.js";
import { RatePredictionService } from "../services/rate-prediction.service.js";

const service = new RatePredictionService();

export function predictRate(req: Request, res: Response): void {
  const body = ratePredictionRequestSchema.parse(req.body);
  const result = service.predict(body);
  res.json({ ok: true, data: result });
}
