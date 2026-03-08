import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        email: string;
        organizationId: string;
        role: string;
        scopes: string[];
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    req.auth = verifyAccessToken(header.slice(7));
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
