import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = header.slice(7);

  try {
    const publicKey =
      env.JWT_PUBLIC_KEY && env.JWT_PUBLIC_KEY.includes("\\n")
        ? env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n")
        : env.JWT_PUBLIC_KEY;

    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"]
    });

    if (!decoded || typeof decoded !== "object") {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.auth = decoded as Express.Request["auth"];
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
