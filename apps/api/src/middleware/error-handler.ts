import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/errors.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({
    ok: false,
    error: "Route not found",
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      error: "Validation error",
      details: err.flatten(),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      ok: false,
      error: err.message,
    });
  }

  const message = err instanceof Error ? err.message : "Internal server error";

  return res.status(500).json({
    ok: false,
    error: message,
  });
}
