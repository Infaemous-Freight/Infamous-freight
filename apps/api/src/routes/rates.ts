import { Router } from "express";
import { predictRate } from "../controllers/rates.controller.js";

const router = Router();

router.post("/predict", predictRate);

export default router;
