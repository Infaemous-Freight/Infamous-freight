import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateBody } from "../../middleware/validate.js";
import { loginSchema, refreshSchema, revokeRefreshSchema } from "./auth.schemas.js";

const controller = new AuthController();
export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), (req, res, next) =>
  controller.login(req, res).catch(next)
);

authRouter.post("/refresh", validateBody(refreshSchema), (req, res, next) =>
  controller.refresh(req, res).catch(next)
);

authRouter.post("/revoke", validateBody(revokeRefreshSchema), (req, res, next) =>
  controller.revoke(req, res).catch(next)
);
