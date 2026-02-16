// IMPORTANT: Initialize Sentry instrumentation first, before requiring any other modules
require("./instrument.js");

// Initialize Datadog APM early, before requiring Express internals
if (process.env.DD_TRACE_ENABLED === "true") {
  try {
    require("dd-trace").init({
      service: process.env.DD_SERVICE || "infamous-freight-api",
      env: process.env.DD_ENV || process.env.NODE_ENV || "development",
      runtimeMetrics: process.env.DD_RUNTIME_METRICS_ENABLED === "true",
    });
  } catch (e) {
    // Fail open if dd-trace is not installed
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection", reason);
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException", err);
  process.exit(1);
});
const express = require("express");
const { corsMiddleware } = require("./middleware/cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const {
  httpLogger,
  logger,
  correlationMiddleware,
  performanceMiddleware,
} = require("./middleware/logger");
const metricsRecorderMiddleware = require("./middleware/metricsRecorder");
const { cacheResponseMiddleware } = require("./middleware/responseCache");
const { rateLimit } = require("./middleware/security");
const { authMiddleware: jwtRotationAuth } = require("./auth/jwtRotation");
const errorHandler = require("./middleware/errorHandler");
const { securityHeaders, handleCSPViolation } = require("./middleware/securityHeaders");
const { initSentry: legacySentry, attachErrorHandler } = require("./config/sentry");
const { initSentry, Sentry } = require("./observability/sentry");
const config = require("./config");
const { compressionMiddleware } = require("./middleware/performance");
const healthRoutes = require("./routes/health");
const healthDetailedRoutes = require("./routes/health-detailed");
const aiRoutes = require("./routes/ai.commands");
const billingRoutes = require("./routes/billing");
const billingPaymentsRoutes = require("./routes/billing-payments");
const { stripeRouter, stripeWebhookRouter } = require("./routes/stripe");
const voiceRoutes = require("./routes/voice");
const aiSimRoutes = require("./routes/aiSim.internal");
const phase10AiRoutes = require("./routes/phase10.ai");
const usersRoutes = require("./routes/users");
const shipmentsRoutes = require("./routes/shipments");
const analyticsRoutes = require("./routes/analytics");
const phase11AnalyticsRoutes = require("./routes/phase11.analytics");
const metricsRoutes = require("./routes/metrics");
const adminFeatureFlagsRoutes = require("./routes/admin/feature-flags");
const adminOpsRoutes = require("./routes/admin/ops");
const adminAuditLogsRoutes = require("./routes/admin/audit-logs");
const insuranceRoutes = require("./modules/insurance/routes");
const avatarsRouter = require("./avatars/routes");
const genesisRouter = require("./genesis/routes");
const satelliteRouter = require("./satellite/routes");
const billingRouter = require("./billing/routes");
const authRouter = require("./auth/routes");
const marketplaceRoutes = require("./routes/marketplace");
const complianceRoutes = require("./routes/compliance");
const documentsRoutes = require("./routes/documents");
const loadboardRoutes = require("./routes/loadboard");
const webhookRoutes = require("./routes/webhooks");
const analyticsRoutesPhase2 = require("./routes/analytics.routes");
const mlRoutes = require("./routes/ml.routes");
const geofencingRoutes = require("./routes/geofencing.routes");
const notificationsRoutes = require("./routes/notifications.routes");
// Phase 3 Routes
const b2bShipperRoutes = require("./routes/b2b-shipper-api");
const fintechRoutes = require("./routes/fintech");
// Phase 4 Routes
const neuralNetworksRoutes = require("./routes/neural-networks");
const realtimeNotificationsRoutes = require("./routes/realtime-notifications");
const blockchainAuditRoutes = require("./routes/blockchain-audit");
const advancedGeofencingRoutes = require("./routes/advanced-geofencing");
const analyticsBIRoutes = require("./routes/analytics-bi");
const complianceInsuranceRoutes = require("./routes/compliance-insurance");
const phase9AdvancedRoutes = require("./routes/phase9.advanced");
const marketplaceEnabled =
  String(
    process.env.FEATURE_GET_TRUCKN ?? process.env.MARKETPLACE_ENABLED ?? "true",
  ).toLowerCase() === "true";
let marketplaceRouter;
let marketplaceBillingRouter;
let marketplaceWebhooks;
let marketplaceMetricsRouter;
let dispatchQueue;
let expiryQueue;
let etaQueue;
let createBullBoard;
let BullMQAdapter;
let ExpressAdapter;
if (marketplaceEnabled) {
  marketplaceRouter = require("./marketplace/router");
  marketplaceBillingRouter = require("./marketplace/billingRouter");
  marketplaceWebhooks = require("./marketplace/webhooks");
  marketplaceMetricsRouter = require("./routes/marketplace-metrics");
  // Phase 15: Bull Board ops UI
  ({ dispatchQueue, expiryQueue, etaQueue } = require("./queue/queues"));
  ({ createBullBoard } = require("@bull-board/api"));
  ({ BullMQAdapter } = require("@bull-board/api/bullMQAdapter"));
  ({ ExpressAdapter } = require("@bull-board/express"));
  // Phase 19: Initialize metrics service (skip in test environment)
  if (process.env.NODE_ENV !== "test") {
    try {
      const { getMetricsService } = require("./services/metricsService");
      getMetricsService(); // Initialize singleton
    } catch (e) {
      // Fail open if metrics service unavailable
    }
  }
}
const { notifyRouter } = require("./notify/router");
const { uploadsRouter } = require("./uploads/router");
const { validateRuntimeEnv } = require("./config/validate");
const bodyLoggingMiddleware = require("./middleware/bodyLogging");
const { auditContextMiddleware, initializeAuditLogging } = require("./middleware/auditLogging");
const { withIdempotency } = require("./middleware/idempotency");

const app = express();
const DEFAULT_REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);
const idempotencyMiddleware = withIdempotency();

// Prevent hung requests from consuming resources indefinitely
app.use((req, res, next) => {
  req.setTimeout(DEFAULT_REQUEST_TIMEOUT_MS);
  res.setTimeout(DEFAULT_REQUEST_TIMEOUT_MS + 2000);
  next();
});

// Validate critical runtime env early

validateRuntimeEnv();

// Initialize Sentry for error tracking (must be early)
legacySentry(app);
initSentry("api");

// Mount Sentry request and tracing handlers (must be early)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.set("trust proxy", 1);

// Apply enhanced security headers
securityHeaders(app);

// CORS allowlist (server-to-server allowed when Origin is absent)
app.use(corsMiddleware());
app.use(correlationMiddleware);
app.use(performanceMiddleware);
app.use(bodyLoggingMiddleware); // Log request/response bodies with sensitive data redacted
app.use(metricsRecorderMiddleware);
app.use(cacheResponseMiddleware);
app.use(httpLogger);
app.use(compressionMiddleware); // Add compression for all responses
app.use(rateLimit);

// Optional JWT rotation-ready validator (populates req.auth if configured)
app.use(jwtRotationAuth());

// Set audit context (user ID, organization ID) for mutation tracking
app.use(auditContextMiddleware);

// Idempotency middleware - Prevent duplicate operations via Idempotency-Key header
app.use(idempotencyMiddleware);

// Stripe webhooks need raw body - must be before express.json()
if (marketplaceEnabled && marketplaceWebhooks) {
  app.use("/api/webhooks", marketplaceWebhooks.router || marketplaceWebhooks);
}
if (stripeWebhookRouter) {
  app.use("/api/stripe", stripeWebhookRouter);
}

app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

// Swagger API Documentation
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Infamous Freight API Docs",
  }),
);

// Routes
app.use("/api", healthRoutes);
app.use("/api", healthDetailedRoutes);
app.use("/api", aiRoutes);
app.use("/api", phase10AiRoutes);
app.use("/api", billingRoutes);
app.use("/api", billingPaymentsRoutes);
app.use("/api", voiceRoutes);
app.use("/api", usersRoutes);
app.use("/api", shipmentsRoutes);
app.use("/api/loads", loadboardRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/analytics/phase11", phase11AnalyticsRoutes);
app.use("/api/analytics", analyticsRoutesPhase2);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/geofencing", geofencingRoutes);
app.use("/api/notifications", notificationsRoutes);
// Phase 3 Routes
app.use("/api/b2b", b2bShipperRoutes);
app.use("/api/fintech", fintechRoutes);
// Phase 4 Routes
app.use("/api/v4/ml", neuralNetworksRoutes);
app.use("/api/v4/notifications", realtimeNotificationsRoutes);
app.use("/api/v4/blockchain", blockchainAuditRoutes);
app.use("/api/v4/geofencing", advancedGeofencingRoutes);
app.use("/api/v4/analytics", analyticsBIRoutes);
app.use("/api/v4/compliance", complianceInsuranceRoutes);
app.use("/api", phase9AdvancedRoutes);
app.use("/api", metricsRoutes);
app.use("/api", adminFeatureFlagsRoutes);
app.use("/api", adminOpsRoutes);
app.use("/api", adminAuditLogsRoutes);
app.use("/api", insuranceRoutes);
app.use("/api/stripe", stripeRouter);
app.use("/v1/auth", authRouter);

// Serve static avatar files (Phase 1 & Phase 2)
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use(
  "/avatars/main",
  express.static(path.join(__dirname, "../../apps/web/public/avatars/main")),
);

// Avatar routes (Phase 1 & Phase 2)
app.use("/v1/avatars", avatarsRouter);
app.use("/api/avatars", avatarsRouter); // Legacy path support
app.use("/v1/genesis", genesisRouter);
app.use("/v1/satellite", satelliteRouter);
app.use("/v1/billing", billingRouter);
app.use("/api/notify", notifyRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api", marketplaceRoutes);
app.use("/api", complianceRoutes);
app.use("/api", documentsRoutes);
if (marketplaceEnabled && marketplaceRouter) {
  app.use("/api/marketplace", marketplaceRouter);
}
if (marketplaceEnabled && marketplaceBillingRouter) {
  app.use("/api/marketplace/billing", marketplaceBillingRouter);
}
if (marketplaceEnabled && marketplaceMetricsRouter && process.env.NODE_ENV !== "test") {
  app.use("/api/marketplace", marketplaceMetricsRouter);
}
app.get("/health", (_req, res) => res.status(200).send("ok"));

// Mount Bull Board (ops dashboard)
try {
  if (
    marketplaceEnabled &&
    dispatchQueue &&
    expiryQueue &&
    etaQueue &&
    String(process.env.BULLBOARD_ENABLED || "true").toLowerCase() === "true"
  ) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath(process.env.BULLBOARD_PATH || "/ops/queues");
    createBullBoard({
      queues: [
        new BullMQAdapter(dispatchQueue),
        new BullMQAdapter(expiryQueue),
        new BullMQAdapter(etaQueue),
      ],
      serverAdapter,
    });
    app.use(process.env.BULLBOARD_PATH || "/ops/queues", serverAdapter.getRouter());
  }
} catch (e) {
  // Fail open if bull-board not available
}

// CSP Violation Report Handler
app.post("/api/csp-violation", handleCSPViolation);

// Status endpoint - operational snapshot (for ops monitoring)
app.get("/api/status", async (_req, res) => {
  if (!marketplaceEnabled || !dispatchQueue) {
    return res.json({
      ok: true,
      time: new Date().toISOString(),
      release: process.env.RELEASE_SHA || null,
      environment: process.env.NODE_ENV || "development",
      queues: null,
      worker: null,
    });
  }

  try {
    const queues = await Promise.all([
      dispatchQueue.getJobCounts("waiting", "active", "delayed", "failed"),
      expiryQueue.getJobCounts("waiting", "active", "delayed", "failed"),
      etaQueue.getJobCounts("waiting", "active", "delayed", "failed"),
    ]);

    // Check worker heartbeat
    let workerHeartbeat = null;
    try {
      const { cacheGetJson } = require("./lib/redisCache");
      workerHeartbeat = await cacheGetJson("heartbeat:worker");
    } catch (_e) {
      // Redis not available or not configured
    }

    res.json({
      ok: true,
      time: new Date().toISOString(),
      release: process.env.RELEASE_SHA || null,
      environment: process.env.NODE_ENV || "development",
      queues: {
        dispatch: queues[0],
        expiry: queues[1],
        eta: queues[2],
      },
      worker: {
        heartbeat: workerHeartbeat,
      },
    });
  } catch (error) {
    logger.error("Status endpoint error", { error: error.message });
    res.status(500).json({
      ok: false,
      error: error.message,
      time: new Date().toISOString(),
    });
  }
});

// Internal synthetic engine simulator
app.use("/internal", aiSimRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler (must be last, after Sentry)
app.use(errorHandler);

// Attach Sentry error handler (must be after all other middleware and error handler)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}
attachErrorHandler(app);

const apiConfig = config.getApiConfig();
const port = Number(process.env.PORT ?? apiConfig.port ?? 4000);
const host = "0.0.0.0";
let httpServer;

if (require.main === module) {
  httpServer = app.listen(port, host, async () => {
    logger.info(`Infamous Freight API listening on ${host}:${port}`);

    // Initialize Prisma audit logging
    try {
      const { prisma } = require("./db/prisma");
      initializeAuditLogging(prisma);
      logger.info("Prisma audit logging initialized");
    } catch (error) {
      logger.warn("Audit logging initialization failed", { error: error.message });
    }

    // Initialize Real-Time WebSocket server
    try {
      const realtimeService = require("./services/realtime");
      realtimeService.initialize(httpServer);
      logger.info("Real-Time WebSocket server initialized");
    } catch (error) {
      logger.warn("Real-Time WebSocket initialization failed", {
        error: error.message,
      });
    }

    // Initialize Load Board Services (DAT, TruckStop, Convoy)
    try {
      const datLoadboard = require("./services/datLoadboard");
      const truckstopService = require("./services/truckstopLoadboard");
      const convoyService = require("./services/convoyLoadboard");

      await datLoadboard.initialize();
      await truckstopService.initialize();
      await convoyService.initialize();
      logger.info("Load board services initialized");
    } catch (error) {
      logger.warn("Load board services initialization failed", {
        error: error.message,
      });
    }

    // Initialize WebSocket server
    try {
      const { initializeWebSocket } = require("./services/websocket");
      initializeWebSocket(httpServer);
      logger.info("WebSocket server initialized");
    } catch (error) {
      logger.warn("WebSocket initialization failed", { error: error.message });
    }

    // Initialize Redis cache (optional)
    try {
      const { initializeRedis } = require("./services/cache");
      await initializeRedis();
    } catch (error) {
      logger.warn("Redis initialization failed, using memory cache", {
        error: error.message,
      });
    }

    // Initialize worker heartbeat monitoring
    try {
      const { startHeartbeat } = require("./worker/heartbeat");
      startHeartbeat("api"); // API can report its own heartbeat
      logger.info("API heartbeat monitoring initialized");
    } catch (error) {
      logger.warn("API heartbeat initialization failed", {
        error: error.message,
      });
    }
  });
}

const SHUTDOWN_TIMEOUT_MS = 10000;

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  try {
    const { prisma } = require("./db/prisma");
    await prisma?.$disconnect?.();
  } catch (error) {
    logger.warn("Prisma disconnect failed", { error: error.message });
  }

  if (httpServer) {
    httpServer.close((err) => {
      if (err) {
        logger.error("HTTP server close error", { error: err.message });
        process.exit(1);
      }
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Force exit after graceful shutdown timeout");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
  } else {
    process.exit(0);
  }
}

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

module.exports = app;
