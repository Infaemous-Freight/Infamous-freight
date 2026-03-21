import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
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

export function createApp(): Express {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: env.corsOrigin.split(",").map((origin) => origin.trim()),
      credentials: env.authCookieEnabled,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    }),
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);
  app.use(httpLoggerMiddleware);
  app.use(generalLimiter);

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        service: "infamous-freight-api",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get("/readyz", (_req, res) => {
    res.json({ success: true, data: { ok: true } });
  });

  app.use("/auth", authRoutes);
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
