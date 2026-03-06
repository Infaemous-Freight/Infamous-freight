import { zAICommand } from "@infamous/shared";
import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { processAICommand } from "../services/ai.service.js";
import { parseOrThrow } from "../utils/validate.js";

export const ai = Router();

ai.post("/command", requireAuth, async (req, res, next) => {
  try {
    const body = parseOrThrow(zAICommand, req.body);

    const authenticatedTenantId = (req as any).user?.tenantId;
    if (authenticatedTenantId) {
      if ((body as any).tenantId && (body as any).tenantId !== authenticatedTenantId) {
        return res.status(403).json({ error: "Tenant mismatch" });
      }
      (body as any).tenantId = authenticatedTenantId;
    }
    res.json(processAICommand(body));
  } catch (e) {
    next(e);
  }
});
