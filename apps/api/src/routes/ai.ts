import { Router } from "express";
import { executeAiCommand } from "../controllers/ai.controller.js";

const router = Router();

router.post("/command", executeAiCommand);

export default router;
