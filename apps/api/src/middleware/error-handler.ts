import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/errors.js";

function resolveRequestId(req: Request): string | null {
  if (typeof req.requestId === "string" && req.requestId.length > 0) {
    return req.requestId;
  }

  const headerRequestId = req.headers["x-request-id"];
  if (typeof headerRequestId === "string" && headerRequestId.length > 0) {
    return headerRequestId;
  }

  if (Array.isArray(headerRequestId) && headerRequestId.length > 0) {
    const firstRequestId = headerRequestId[0];
    return typeof firstRequestId === "string" && firstRequestId.length > 0 ? firstRequestId : null;
  }

  return null;
}

export function notFound(req: Request, res: Response): void {
  const requestId = resolveRequestId(req);
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
      ...(requestId ? { requestId } : {}),
    },
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = resolveRequestId(req);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        ...(requestId ? { requestId } : {}),
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(requestId ? { requestId } : {}),
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      ...(requestId ? { requestId } : {}),
    },
  });
}
