import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { requestIdMiddleware, httpLoggerMiddleware } from "./lib/logger.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import aiRoutes from "./routes/ai.js";
import aiV2Routes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.js";
import billingRoutes from "./routes/billing.js";
import brokerRoutes from "./routes/brokers.js";
import carrierRoutes from "./routes/carriers.js";
import { dashboardRoutes } from "./routes/dashboard.routes.js";
import dispatchRoutes from "./routes/dispatches.js";
import { documentsRoutes } from "./routes/documents.routes.js";
import driverRoutes from "./routes/drivers.js";
import invoiceRoutes from "./routes/invoices.js";
import { loadboard } from "./routes/loadboard.js";
import loadRoutes from "./routes/loads.js";
import paymentRoutes from "./routes/payments.js";
import rateRoutes from "./routes/rates.js";
import { realtimeRoutes } from "./routes/realtime.routes.js";
import referralRoutes from "./routes/referrals.js";
import salesRoutes from "./routes/sales.js";
import shipmentRoutes from "./routes/shipments.js";
import { stripeRoutes } from "./routes/stripe.routes.js";
import { tenants } from "./routes/tenants.js";
import stripeWebhookRoutes from "./webhooks/stripe.js";

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
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "Stripe-Signature"],
    }),
  );

  app.use(cookieParser(env.cookieSecret));
  app.use(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    stripeWebhookRoutes,
  );
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

  app.get("/api/health", (_req, res) => {
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
  app.use("/api/ai", aiV2Routes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/ai/v2", aiV2Routes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/billing", billingRoutes);
  app.use("/api/brokers", brokerRoutes);
  app.use("/api/carriers", carrierRoutes);
  app.use("/api/dispatches", dispatchRoutes);
  app.use("/api/documents", documentsRoutes);
  app.use("/api/drivers", driverRoutes);
  app.use("/api/invoices", invoiceRoutes);
  app.use("/api/loadboard", loadboard);
  app.use("/api/loads", loadRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/rates", rateRoutes);
  app.use("/api/realtime", realtimeRoutes);
  app.use("/api/referrals", referralRoutes);
  app.use("/api/sales", salesRoutes);
  app.use("/api/shipments", shipmentRoutes);
  app.use("/api/stripe", stripeRoutes);
  app.use("/api/tenants", tenants);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
