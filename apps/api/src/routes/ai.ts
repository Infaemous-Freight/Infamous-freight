import { Router } from "express";
import { z } from "zod";
import { OrchestrationService } from "../services/orchestration.service.js";

const router = Router();
const orchestration = new OrchestrationService();

router.post("/command", (req, res) => {
  const body = z.object({ command: z.string().min(3) }).parse(req.body);
  const result = orchestration.execute(body.command);

  res.json({
    ok: true,
    data: result
  });
});

export default router;
