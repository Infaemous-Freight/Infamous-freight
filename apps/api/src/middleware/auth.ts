import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    req.auth = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
