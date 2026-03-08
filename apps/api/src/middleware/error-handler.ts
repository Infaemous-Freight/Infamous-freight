import type { NextFunction, Request, Response } from "express";
import { captureError } from "../lib/telemetry.js";
import { HttpError } from "../utils/http-error.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  captureError(err);

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
      requestId: req.requestId
    });
  }

  return res.status(500).json({
    error: "Internal server error",
    requestId: req.requestId
  });
}
