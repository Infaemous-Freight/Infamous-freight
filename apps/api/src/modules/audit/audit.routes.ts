import { Router } from "express";
import { requireScope } from "../../middleware/require-scope.js";
import { AuditService } from "./audit.service.js";

const router = Router();
const service = new AuditService();

router.get("/", requireScope("audit.read"), async (req, res) => {
  const items = await service.list(req.auth!.organizationId);
  res.json(items);
});

export const auditRouter = router;
