import { Router } from "express";
import { db } from "../lib/db.js";

const router = Router();

router.get("/health", async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      service: "infamous-freight-api",
      database: "connected",
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      service: "infamous-freight-api",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown database error",
    });
  }
});

export default router;
export { router as health };
