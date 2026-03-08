import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({
    ok: false,
    error: "Route not found"
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      error: "Validation error",
      details: err.flatten()
    });
  }

  const message = err instanceof Error ? err.message : "Internal server error";

  return res.status(500).json({
    ok: false,
    error: message
  });
}
