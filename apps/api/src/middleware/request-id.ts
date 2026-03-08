import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";

export function requestId(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("x-request-id", crypto.randomUUID());
  next();
}
