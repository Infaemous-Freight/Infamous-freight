import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { requestIdMiddleware, httpLoggerMiddleware } from "./lib/logger.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import aiRoutes from "./routes/ai.js";
import carrierRoutes from "./routes/carriers.js";
import rateRoutes from "./routes/rates.js";
import shipmentRoutes from "./routes/shipments.js";

dotenv.config();

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(requestIdMiddleware);
  app.use(httpLoggerMiddleware);

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "infamous-freight-api",
      uptime: process.uptime()
    });
  });

  app.use("/api/ai", aiRoutes);
  app.use("/api/carriers", carrierRoutes);
  app.use("/api/rates", rateRoutes);
  app.use("/api/shipments", shipmentRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
