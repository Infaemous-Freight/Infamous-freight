import type { NextFunction, Request, Response } from "express";

export function tenantContext(_req: Request, _res: Response, next: NextFunction) {
  next();
}
