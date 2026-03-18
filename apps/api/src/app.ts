import cors from "cors";
import dotenv from "dotenv";
import express, { type Express } from "express";
import helmet from "helmet";
import { requestIdMiddleware, httpLoggerMiddleware } from "./lib/logger.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import aiRoutes from "./routes/ai.js";
import authRoutes from "./routes/auth.js";
import carrierRoutes from "./routes/carriers.js";
import dispatchRoutes from "./routes/dispatches.js";
import driverRoutes from "./routes/drivers.js";
import loadRoutes from "./routes/loads.js";
import rateRoutes from "./routes/rates.js";
import shipmentRoutes from "./routes/shipments.js";
import { ENV } from "./env.js";

dotenv.config();

export function createApp(): Express {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }),
  );

  app.use(
    cors({
      origin: ENV.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(requestIdMiddleware);
  app.use(httpLoggerMiddleware);
  app.use(generalLimiter);

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "infamous-freight-api",
      uptime: process.uptime(),
      ts: new Date().toISOString(),
    });
  });

  app.get("/readyz", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/carriers", carrierRoutes);
  app.use("/api/dispatches", dispatchRoutes);
  app.use("/api/drivers", driverRoutes);
  app.use("/api/loads", loadRoutes);
  app.use("/api/rates", rateRoutes);
  app.use("/api/shipments", shipmentRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
