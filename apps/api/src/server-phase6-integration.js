/**
 * Phase 6 Server Initialization Integration Example
 * Shows how to integrate all Phase 6 components into your Express server
 */

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const { logger } = require("./middleware/logger");
const { auditMiddleware } = require("./services/audit");
const { corsMiddleware } = require("./middleware/cors");
const errorHandler = require("./middleware/errorHandler");

// Phase 6 Imports
const { validateDatabaseConnection, buildDatabaseUrl } = require("./config/database");

const {
  initializeSchedulers,
  startEmailWorker,
  startWebhookWorker,
  startAuditWorker,
  startBatchWorker,
  getQueueStats,
} = require("./services/queue");

const { getBackupStats } = require("./services/backup");

const app = express();

/**
 * PHASE 6 INTEGRATION: Database Connection Pooling
 */
async function initializeDatabase() {
  try {
    // Ensure DATABASE_URL includes connection_limit parameter
    const dbUrl = buildDatabaseUrl(process.env.DATABASE_URL);
    process.env.DATABASE_URL = dbUrl;

    // Validate connection
    const prisma = require("./db/prisma").prisma;
    await validateDatabaseConnection(prisma);

    logger.info("✅ Database connection pool initialized", {
      url: dbUrl.split("?")[0], // Hide credentials
    });

    return prisma;
  } catch (error) {
    logger.error("❌ Database initialization failed", { error: error.message });
    process.exit(1);
  }
}

/**
 * PHASE 6 INTEGRATION: Message Queue System
 */
async function initializeQueues() {
  try {
    // Initialize queue schedulers
    initializeSchedulers();
    logger.info("✅ Queue schedulers initialized");

    // Start workers
    const emailWorker = startEmailWorker();
    const webhookWorker = startWebhookWorker();
    const auditWorker = startAuditWorker();
    const batchWorker = startBatchWorker();

    logger.info("✅ Queue workers started", {
      workers: ["email", "webhook", "audit", "batch"],
    });

    return {
      emailWorker,
      webhookWorker,
      auditWorker,
      batchWorker,
    };
  } catch (error) {
    logger.error("❌ Queue initialization failed", { error: error.message });
    // Don't exit - queues are optional
  }
}

/**
 * PHASE 6 INTEGRATION: Middleware Stack
 */
function setupMiddleware() {
  // 1. Cors
  app.use(corsMiddleware);

  // 2. Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // 3. Audit Logging (logs all data-modifying operations)
  app.use("/api", auditMiddleware);

  // 4. Authentication (your existing middleware)
  // app.use('/api', authMiddleware);

  logger.info("✅ Middleware stack initialized");
}

/**
 * PHASE 6 INTEGRATION: Swagger/OpenAPI Documentation
 */
function setupSwagger() {
  // Serve Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui { background: #f9f9f9; }",
      customSiteTitle: "Infæmous Freight API",
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );

  // Serve OpenAPI spec as JSON
  app.get("/api-docs.json", (req, res) => {
    res.json(swaggerSpec);
  });

  logger.info("✅ Swagger documentation mounted", {
    url: "http://localhost:4000/api-docs",
  });
}

/**
 * PHASE 6 INTEGRATION: Health Check with Backup Status
 */
function setupHealthCheck() {
  app.get("/api/health", async (req, res) => {
    try {
      const prisma = require("./db/prisma").prisma;
      const queueStats = await getQueueStats();
      const backupStats = await getBackupStats();

      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: {
            status: "connected",
            pool: "active",
          },
          redis: {
            status: queueStats ? "connected" : "disconnected",
            queues: queueStats?.length || 0,
          },
          backups: {
            status: backupStats?.healthy ? "healthy" : "warning",
            lastBackup: backupStats?.latestBackup?.date,
            daysSince: backupStats?.latestBackup?.daysSinceBackup,
          },
        },
      };

      res.json(health);
    } catch (error) {
      logger.error("Health check failed", { error: error.message });
      res.status(503).json({
        status: "unhealthy",
        error: error.message,
      });
    }
  });

  logger.info("✅ Health check endpoint configured");
}

/**
 * PHASE 6 INTEGRATION: Admin Monitoring Endpoints
 */
function setupAdminMonitoring() {
  // Queue statistics endpoint (for dashboard)
  app.get("/api/admin/monitoring/queues", async (req, res) => {
    try {
      // Verify admin role
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const stats = await getQueueStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Backup statistics endpoint
  app.get("/api/admin/monitoring/backups", async (req, res) => {
    try {
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const stats = await getBackupStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  logger.info("✅ Admin monitoring endpoints configured");
}

/**
 * PHASE 6 INTEGRATION: Error Handler (last middleware)
 */
function setupErrorHandling() {
  app.use(errorHandler);
  logger.info("✅ Error handling middleware configured");
}

/**
 * Main Server Initialization
 */
async function startServer() {
  try {
    logger.info("🚀 Starting Infæmous Freight API Server...");

    // 1. Initialize database with connection pooling
    await initializeDatabase();

    // 2. Initialize message queue system
    await initializeQueues();

    // 3. Setup middleware stack
    setupMiddleware();

    // 4. Setup Swagger/OpenAPI documentation
    setupSwagger();

    // 5. Setup health checks
    setupHealthCheck();

    // 6. Setup admin monitoring endpoints
    setupAdminMonitoring();

    // 7. Setup error handling
    setupErrorHandling();

    // 8. Mount your existing routes
    // const healthRoutes = require('./routes/health');
    // const shipmentsRoutes = require('./routes/shipments');
    // const billingRoutes = require('./routes/billing');
    // etc...

    // Start server
    const port = process.env.API_PORT || 4000;
    app.listen(port, () => {
      logger.info("✅ Server started successfully", {
        port,
        env: process.env.NODE_ENV,
        apiDocs: `http://localhost:${port}/api-docs`,
        health: `http://localhost:${port}/api/health`,
      });
    });
  } catch (error) {
    logger.error("❌ Server startup failed", { error: error.message });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");

  const { closeQueues } = require("./services/queue");
  await closeQueues();

  const prisma = require("./db/prisma").prisma;
  await prisma.$disconnect();

  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
