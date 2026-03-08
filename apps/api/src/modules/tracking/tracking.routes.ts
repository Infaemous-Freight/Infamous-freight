import { Router } from "express";
import { TrackingController } from "./tracking.controller.js";
import { requireScope } from "../../middleware/require-scope.js";
import { validateBody } from "../../middleware/validate.js";
import { ingestGpsSchema } from "./tracking.schemas.js";
import { rateLimit } from "../../middleware/rate-limit.js";

const controller = new TrackingController();
export const trackingRouter = Router();

trackingRouter.post(
  "/gps/ingest",
  requireScope("anomaly.evaluate"),
  rateLimit({ windowSec: 60, max: 240, prefix: "gps-ingest" }),
  validateBody(ingestGpsSchema),
  (req, res, next) => controller.ingestGps(req, res).catch(next)
);
