import type { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.requestId = req.header("x-request-id") ?? uuid();
  res.setHeader("x-request-id", req.requestId);
  next();
}
