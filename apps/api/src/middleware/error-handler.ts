import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import * as Sentry from "@sentry/node";
import { ApiError } from "../utils/errors.js";
import { logger } from "../lib/logger.js";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const correlationId = (req.headers["x-request-id"] as string) || `${Date.now()}-${Math.random()}`;

  if (err instanceof ZodError) {
    logger.warn(
      {
        method: req.method,
        path: req.originalUrl || req.path,
        correlationId,
        validation: err.flatten(),
      },
      "Validation error",
    );

    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(
        {
          method: req.method,
          path: req.originalUrl || req.path,
          statusCode: err.statusCode,
          error: err.message,
          correlationId,
        },
        "API error",
      );

      // Capture in Sentry for 5xx errors
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(err, {
          tags: {
            path: req.path,
            method: req.method,
            status: err.statusCode,
          },
        });
      }
    } else {
      logger.debug(
        {
          method: req.method,
          path: req.originalUrl || req.path,
          statusCode: err.statusCode,
          error: err.message,
          correlationId,
        },
        "Client error",
      );
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  const status = (err as any)?.status || (err as any)?.statusCode || 500;
  const message = (err as any)?.message || "Internal server error";

  logger.error(
    {
      method: req.method,
      path: req.originalUrl || req.path,
      status,
      error: message,
      stack: (err as Error)?.stack,
      correlationId,
    },
    "Unhandled error",
  );

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: {
        path: req.path,
        method: req.method,
        status,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
  });
}
