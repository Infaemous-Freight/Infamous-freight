import { Router } from "express";
import { requireScope } from "../../middleware/require-scope.js";
import { DispatchController } from "./dispatch.controller.js";

const controller = new DispatchController();
export const dispatchRouter = Router();

dispatchRouter.post("/:loadId/recommend", requireScope("dispatch.recommend"), (req, res, next) =>
  controller.recommend(req, res).catch(next)
);

dispatchRouter.post(
  "/:loadId/assign/:driverId",
  requireScope("dispatch.assign"),
  (req, res, next) => controller.assign(req, res).catch(next)
);
