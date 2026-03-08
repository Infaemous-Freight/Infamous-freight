import type { Request, Response, NextFunction } from "express";

export function tenantContext(req: Request, res: Response, next: NextFunction) {
  if (!req.auth?.organizationId) {
    return res.status(403).json({
      error: "forbidden",
  if (!req.auth?.tenantId) {
    return next(new Error("Missing tenant context"));
  }

  req.headers["x-tenant-id"] = req.auth.tenantId;
  return next();
}
