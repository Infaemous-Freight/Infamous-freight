import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { authLimiter } from "../../middleware/rateLimit.js";
import {
  loginController,
  logoutAllController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "./auth.controller.js";

const router = Router();

router.post("/register", authLimiter, registerController);
router.post("/login", authLimiter, loginController);
router.post("/refresh", authLimiter, refreshController);
router.post("/refresh-token", authLimiter, refreshController);
router.post("/logout", authLimiter, requireAuth, logoutController);
router.post("/logout-all", requireAuth, logoutAllController);
router.get("/me", requireAuth, meController);

export default router;
