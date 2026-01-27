const express = require("express");
const { version } = require("../../package.json");
const { prisma } = require("../db/prisma");
const { getStats: getCacheStats } = require("../services/cache");
const { getConnectedClientsCount } = require("../services/websocket");
const { auditLog } = require("../middleware/security");
const { asyncHandler, createSuccessResponse, createErrorResponse } = require("../lib/errors");
const { HTTP_STATUS } = require("../config/constants");

const router = express.Router();

// Basic health check
router.get("/health", auditLog, asyncHandler(async (_req, res) => {
  const healthData = {
    status: "ok",
    service: "infamous-freight-api",
    version: version || "2.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  };
  
  res.status(HTTP_STATUS.OK).json(createSuccessResponse(healthData));
}));

// Detailed health check with service dependencies
router.get("/health/detailed", auditLog, asyncHandler(async (_req, res) => {
  const checks = {
    api: { status: "healthy", message: "API is running" },
    database: { status: "unknown", message: "Not checked" },
    cache: { status: "unknown", message: "Not checked" },
    websocket: { status: "unknown", message: "Not checked" },
  };

  let overallStatus = "healthy";

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "healthy",
      message: "Database connection successful",
    };
  } catch (error) {
    checks.database = {
      status: "unhealthy",
      message: `Database error: ${error.message}`,
    };
    overallStatus = "degraded";
  }

  // Check cache
  try {
    const cacheStats = await getCacheStats();
    checks.cache = {
      status: "healthy",
      message: `Cache type: ${cacheStats.type}`,
      stats: cacheStats,
    };
  } catch (error) {
    checks.cache = {
      status: "degraded",
      message: `Cache error: ${error.message}`,
    };
  }

  // Check WebSocket
  try {
    const connectedClients = getConnectedClientsCount();
    checks.websocket = {
      status: "healthy",
      message: `${connectedClients} clients connected`,
      connectedClients,
    };
  } catch (error) {
    checks.websocket = {
      status: "degraded",
      message: `WebSocket error: ${error.message}`,
    };
  }

  // Overall status
  const unhealthyServices = Object.values(checks).filter(
    (check) => check.status === "unhealthy",
  ).length;

  if (unhealthyServices > 0) {
    overallStatus = "unhealthy";
  } else if (
    Object.values(checks).some((check) => check.status === "degraded")
  ) {
    overallStatus = "degraded";
  }

  const statusCode = overallStatus === "unhealthy" ? HTTP_STATUS.SERVICE_UNAVAILABLE : HTTP_STATUS.OK;

  const healthData = {
    status: overallStatus,
    service: "infamous-freight-api",
    version: version || "2.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    checks,
  };

  res.status(statusCode).json(createSuccessResponse(healthData));
}));

// Readiness check (for Kubernetes/orchestration)
router.get("/health/ready", auditLog, asyncHandler(async (_req, res) => {
  const checks = {
    database: { status: "unknown", message: "Not checked" },
    cache: { status: "unknown", message: "Not checked" },
  };

  // Check database with timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('DB health check timeout')), 5000)
  );

  await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
  checks.database = { status: "healthy", message: "Database reachable" };

  // Check cache if configured
  const redisConfigured = Boolean(process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING);
  if (!redisConfigured) {
    checks.cache = { status: "healthy", message: "Redis not configured" };
  } else {
    const cacheStats = await getCacheStats();
    const isCacheConnected = cacheStats.connected !== false;
    checks.cache = {
      status: isCacheConnected ? "healthy" : "unhealthy",
      message: isCacheConnected ? "Redis connected" : "Redis unavailable",
      stats: cacheStats,
    };
  }

  const isReady = checks.database.status === "healthy" && checks.cache.status !== "unhealthy";
  const statusCode = isReady ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

  const readyData = {
    status: isReady ? "ready" : "not-ready",
    timestamp: new Date().toISOString(),
    checks,
  };

  res.status(statusCode).json(createSuccessResponse(readyData));
}));

// Liveness check (for Kubernetes/orchestration)
router.get("/health/live", auditLog, asyncHandler(async (_req, res) => {
  const liveData = {
    status: "alive",
    timestamp: new Date().toISOString(),
  };
  
  res.status(HTTP_STATUS.OK).json(createSuccessResponse(liveData));
}));

module.exports = router;
