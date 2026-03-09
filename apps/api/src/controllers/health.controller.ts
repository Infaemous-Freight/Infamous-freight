import type { Request, Response } from "express";

/**
 * GET /health
 * Returns basic service liveness status.
 */
export function getHealth(_req: Request, res: Response): void {
  res.json({
    status: "ok",
    service: "infamous-freight-api",
    timestamp: new Date().toISOString(),
  });
}
