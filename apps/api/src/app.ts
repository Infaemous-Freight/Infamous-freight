import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { Sentry, sentryEnabled } from "./instrument.js";
import { env } from "./config/env.js";
import { getPrisma } from "./db/prisma.js";
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
import sentryAuthRoutes from "./routes/sentry-auth.js";
import shipmentRoutes from "./routes/shipments.js";
import { stripeRoutes } from "./routes/stripe.routes.js";
import { tenants } from "./routes/tenants.js";
import stripeWebhookRoutes from "./webhooks/stripe.js";

const releaseInfo = {
  version: process.env.npm_package_version ?? "unknown",
  release:
    process.env.SENTRY_RELEASE ??
    process.env.RELEASE ??
    process.env.GIT_SHA ??
    process.env.GITHUB_SHA ??
    "unknown",
  commit: process.env.GIT_SHA ?? process.env.GITHUB_SHA ?? "unknown",
};

function healthPayload() {
  return {
    service: "infamous-freight-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: env.nodeEnv,
    version: releaseInfo.version,
    release: releaseInfo.release,
    commit: releaseInfo.commit,
  };
}

async function readinessPayload() {
  const checks: Record<string, { ok: boolean; reason?: string }> = {
    process: { ok: true },
  };

  if (!env.databaseUrl || env.persistenceMode === "json") {
    checks.database = {
      ok: true,
      reason: "Database check skipped by configuration",
    };
  } else {
    try {
      const prisma = getPrisma();
      if (!prisma || typeof prisma.$queryRaw !== "function") {
        throw new Error("Prisma client unavailable");
      }

      await prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true };
    } catch {
      checks.database = {
        ok: false,
        reason: "Database connectivity check failed",
      };
    }
  }

  const ok = Object.values(checks).every((check) => check.ok);

  return {
    ok,
    checks,
    timestamp: new Date().toISOString(),
    version: releaseInfo.version,
    release: releaseInfo.release,
  };
}


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
      data: healthPayload(),
    });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      data: healthPayload(),
    });
  });

  app.get("/version", (_req, res) => {
    res.json({
      success: true,
      data: releaseInfo,
    });
  });

  app.get("/api/version", (_req, res) => {
    res.json({
      success: true,
      data: releaseInfo,
    });
  });

  app.get("/ready", async (_req, res) => {
    const readiness = await readinessPayload();
    res.status(readiness.ok ? 200 : 503).json({
      success: readiness.ok,
      data: readiness,
    });
  });

  app.get("/api/ready", async (_req, res) => {
    const readiness = await readinessPayload();
    res.status(readiness.ok ? 200 : 503).json({
      success: readiness.ok,
      data: readiness,
    });
  });

  app.get("/readyz", async (_req, res) => {
    const readiness = await readinessPayload();
    res.status(readiness.ok ? 200 : 503).json({
      success: readiness.ok,
      data: readiness,
    });
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
  app.use("/api/sentry", sentryAuthRoutes);
  app.use("/api/shipments", shipmentRoutes);
  app.use("/api/stripe", stripeRoutes);
  app.use("/api/tenants", tenants);

  if (env.nodeEnv !== "production") {
    app.get("/debug/sentry", (_req, res) => {
      if (!sentryEnabled) {
        res.status(503).json({
          success: false,
          error: "Sentry is disabled: SENTRY_DSN is not configured",
          captured: false,
        });
        return;
      }

      const error = new Error("Sentry verification route triggered");
      const eventId = Sentry.captureException(error);
      res.status(500).json({
        success: false,
        error: "Sentry test event sent",
        captured: true,
        eventId,
      });
    });
  }

  app.use((err: unknown, req: Request, _res: Response, next: NextFunction) => {
    const statusCode =
      typeof err === "object" &&
      err !== null &&
      "statusCode" in err &&
      typeof err.statusCode === "number"
        ? err.statusCode
        : 500;

    if (sentryEnabled && statusCode >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag("method", req.method);
        scope.setTag("path", req.originalUrl || req.url);

        const requestId = req.headers["x-request-id"];
        if (typeof requestId === "string" && requestId.length > 0) {
          scope.setTag("request_id", requestId);
        }

        scope.setExtra("statusCode", statusCode);
        Sentry.captureException(err);
      });
    }
    next(err);
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
