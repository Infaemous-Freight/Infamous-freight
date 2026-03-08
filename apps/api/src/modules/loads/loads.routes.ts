import { Router } from "express";
import { requireScope } from "../../middleware/require-scope.js";
import { validateBody } from "../../middleware/validate.js";
import { LoadsController } from "./loads.controller.js";
import { createLoadSchema } from "./loads.schemas.js";

const controller = new LoadsController();
export const loadsRouter = Router();

loadsRouter.get("/", requireScope("load.read"), controller.list.bind(controller));
loadsRouter.post(
  "/",
  requireScope("load.create"),
  validateBody(createLoadSchema),
  controller.create.bind(controller)
);
