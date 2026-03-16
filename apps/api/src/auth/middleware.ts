import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/errors.js";
import { verifyToken } from "./jwt.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return next(new HttpError(401, "Missing Bearer token"));
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    next(new HttpError(401, "Invalid token"));
  }
}
