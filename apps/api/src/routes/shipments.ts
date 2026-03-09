import { Router } from "express";
import { predictEtaRisk } from "../controllers/shipments.controller.js";

const router = Router();

router.post("/eta-risk", predictEtaRisk);

export default router;
