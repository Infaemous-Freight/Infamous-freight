import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./env.js";
import { requestIdMiddleware, httpLoggerMiddleware } from "./lib/logger.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import aiRoutes from "./routes/ai.js";
import carrierRoutes from "./routes/carriers.js";
import rateRoutes from "./routes/rates.js";
import shipmentRoutes from "./routes/shipments.js";

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — restrict to configured origin in production
  const corsOrigin =
    env.NODE_ENV === "production"
      ? env.CORS_ORIGIN ?? (() => { throw new Error("CORS_ORIGIN must be set in production"); })()
      : (env.CORS_ORIGIN ?? "*");

  app.use(cors({ origin: corsOrigin, credentials: true }));

  // Body parsing
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  // Observability
  app.use(requestIdMiddleware);
  app.use(httpLoggerMiddleware);

  // Health check — no auth required
  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "infamous-freight-api",
      env: env.NODE_ENV,
      uptime: process.uptime(),
    });
  });

  // Domain routes
  app.use("/api/ai", aiRoutes);
  app.use("/api/carriers", carrierRoutes);
  app.use("/api/rates", rateRoutes);
  app.use("/api/shipments", shipmentRoutes);

  // 404 + global error handler — MUST be last
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
