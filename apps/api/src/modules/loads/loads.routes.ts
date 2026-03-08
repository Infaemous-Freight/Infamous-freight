import { Router } from "express";
import { requireScope } from "../../middleware/require-scope.js";
import { validateBody } from "../../middleware/validate.js";
import { LoadsController } from "./loads.controller.js";
import { createLoadSchema } from "./loads.schemas.js";

const controller = new LoadsController();
export const loadsRouter = Router();

loadsRouter.get("/", requireScope("load.read"), (req, res, next) =>
  controller.list(req, res).catch(next)
);

loadsRouter.post("/", requireScope("load.create"), validateBody(createLoadSchema), (req, res, next) =>
  controller.create(req, res).catch(next)
);
