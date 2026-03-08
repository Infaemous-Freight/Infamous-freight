import type { NextFunction, Request, Response } from "express";

export function tenantContext(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth?.organizationId) {
    return next(new Error("Missing organization context"));
  }

  req.headers["x-organization-id"] = req.auth.organizationId;
  return next();
}
