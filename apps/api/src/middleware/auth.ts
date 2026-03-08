import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_PUBLIC_KEY, {
      algorithms: ["RS256"]
    }) as Express.Request["auth"];

    req.auth = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
