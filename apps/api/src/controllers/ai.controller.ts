import type { Request, Response } from "express";
import { aiCommandRequestSchema } from "../models/ai.model.js";
import { OrchestrationService } from "../services/orchestration.service.js";

const orchestration = new OrchestrationService();

export function executeAiCommand(req: Request, res: Response): void {
  const body = aiCommandRequestSchema.parse(req.body);
  const result = orchestration.execute(body.command);
  res.json({ ok: true, data: result });
}
