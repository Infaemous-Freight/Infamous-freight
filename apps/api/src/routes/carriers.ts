import { Router } from "express";
import { rankCarriers } from "../controllers/carriers.controller.js";

const router = Router();

router.post("/rank", rankCarriers);

export default router;
