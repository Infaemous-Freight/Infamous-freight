import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../env.js";

export interface AuthenticatedRequest extends Request {
  user: { id: string; tenantId: string; role: string; email: string };
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET) as jwt.JwtPayload;
    (req as AuthenticatedRequest).user = {
      id: payload.id ?? payload.sub ?? "",
      tenantId: payload.tenant_id ?? payload.tenantId ?? "",
      role: payload.role ?? "dispatcher",
      email: payload.email ?? "",
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
