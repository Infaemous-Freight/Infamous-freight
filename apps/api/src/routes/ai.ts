import { Router } from "express";
import { z } from "zod";
import { OrchestrationService } from "../services/orchestration.service.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const orchestration = new OrchestrationService();

const commandSchema = z.object({ command: z.string().min(3).max(2000) });

router.post("/command", requireAuth, (req, res, next) => {
  try {
    const body = commandSchema.parse(req.body);
    const result = orchestration.execute(body.command);
    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
