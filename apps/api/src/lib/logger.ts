/**
 * Structured Logger — Pino
 * JSON logging in production, pretty-printed in development.
 * Every log line includes tenantId, requestId, and service context automatically.
 *
 * Usage:
 *   import { logger } from "./lib/logger.js";
 *   logger.info({ shipmentId }, "Shipment created");
 *   logger.error({ err, tenantId }, "Failed to deliver webhook");
 */

import pino, { type Logger } from "pino";
import { env } from "../env.js";

export const logger: Logger = pino({
  level: env.LOG_LEVEL,

  // Always include these fields on every log line
  base: {
    service: process.env.SERVICE_NAME ?? "infamous-freight-api",
    version: process.env.npm_package_version ?? "unknown",
    env: env.NODE_ENV,
  },

  // Rename "msg" → "message" for compatibility with log aggregators
  messageKey: "message",

  // ISO timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Serialize Error objects properly
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Pretty print in development only
  ...(env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname,service,version,env",
      },
    },
  }),
});

// ── Child logger factory ───────────────────────────────────────────────────────
// Creates a logger pre-bound with request context.
// Use in request handlers: const log = requestLogger(req);

export function requestLogger(context: {
  tenantId?: string;
  requestId?: string;
  userId?: string;
  route?: string;
}): Logger {
  return logger.child(context);
}

// ── Request ID middleware ─────────────────────────────────────────────────────
import { type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers["x-request-id"] as string | undefined;
  const requestId =
    incomingId && UUID_PATTERN.test(incomingId) ? incomingId : crypto.randomUUID();
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-Id", requestId);
  (req as Request & { requestId: string }).requestId = requestId;
  next();
}

// ── HTTP request logging middleware ───────────────────────────────────────────
export function httpLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = (req as Request & { requestId?: string }).requestId;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level]({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    }, "HTTP request");
  });

  next();
}
