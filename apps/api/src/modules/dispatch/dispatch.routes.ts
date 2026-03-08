import { Router } from "express";
import { requireScope } from "../../middleware/require-scope.js";
import { DispatchController } from "./dispatch.controller.js";

const controller = new DispatchController();
export const dispatchRouter = Router();

dispatchRouter.post(
  "/:loadId/recommend",
  requireScope("dispatch.recommend"),
  controller.recommend.bind(controller)
);

dispatchRouter.post(
  "/:loadId/assign/:driverId",
  requireScope("dispatch.assign"),
  controller.assign.bind(controller)
);
