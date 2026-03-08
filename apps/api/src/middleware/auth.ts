import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = header.slice(7);

  const publicKey = env.JWT_PUBLIC_KEY;

  if (!publicKey) {
    return res.status(500).json({ error: "JWT public key not configured" });
  }

  // Normalize PEM from .env: convert escaped "\n" sequences into real newlines
  const normalizedPublicKey = publicKey.replace(/\\n/g, "\n");

  try {
    const decoded = jwt.verify(token, normalizedPublicKey, {
      algorithms: ["RS256"]
    }) as Express.Request["auth"];

    req.auth = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
