import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../utils/errors.js";
import { verifyAccessToken } from "./service.js";

export function requireAuthSession(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing or invalid authorization header"));
  }

  try {
    const claims = verifyAccessToken(authHeader.slice(7));
    req.auth = {
      userId: claims.sub,
      orgId: claims.tenantId,
      organizationId: claims.tenantId,
      scopes: ["auth:session"],
      role: claims.role,
    };
    req.user = {
      id: claims.sub,
      email: claims.email,
      role: claims.role,
    };
    req.tenantId = claims.tenantId;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}
