import type { Scope } from "@infamous/shared";
import type { NextFunction, Request, Response } from "express";

export function requireRoleOrScope(roles: string[] = [], scopes: Scope[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.auth?.role;
    const userScopes = req.auth?.scopes ?? [];

    const roleOk = roles.length > 0 && !!userRole && roles.includes(userRole);
    const scopeOk =
      scopes.length > 0 && scopes.every((scope) => userScopes.includes(scope));

    if (!roleOk && !scopeOk) {
      return res.status(403).json({
        error: "Forbidden",
        requiredRoles: roles,
        requiredScopes: scopes
      });
    }

    next();
  };
}
