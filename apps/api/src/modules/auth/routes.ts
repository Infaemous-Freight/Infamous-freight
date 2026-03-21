import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimit.js";
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "./controller.js";
import { requireAuthSession } from "./middleware.js";

const router = Router();

router.post("/register", authLimiter, registerController);
router.post("/login", authLimiter, loginController);
router.post("/refresh", authLimiter, refreshController);
router.post("/logout", authLimiter, logoutController);
router.get("/me", authLimiter, requireAuthSession, meController);

export default router;
