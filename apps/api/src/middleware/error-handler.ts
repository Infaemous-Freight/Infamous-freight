import type { NextFunction, Request, Response } from "express";
import { captureError } from "../lib/telemetry.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  captureError(err);

  return res.status(500).json({
    error: "Internal server error",
    requestId: req.requestId
  });
}
