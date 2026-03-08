import type { NextFunction, Request, Response } from "express";

export function tenantContext(req: Request, res: Response, next: NextFunction) {
  if (!req.auth?.organizationId) {
    return res.status(400).json({ error: "Missing organization context" });
  }
  return next();
}
