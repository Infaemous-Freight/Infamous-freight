import { Router } from "express";
import { requireScope } from "../../middleware/require-scope.js";
import { AnomaliesController } from "./anomalies.controller.js";

const controller = new AnomaliesController();
export const anomaliesRouter = Router();

anomaliesRouter.post(
  "/gps/:driverId/evaluate",
  requireScope("anomaly.evaluate"),
  controller.evaluateDriverGps.bind(controller)
);
