import type { Scope } from "@infamous/shared";
import type { NextFunction, Request, Response } from "express";

export function requireScope(scope: Scope) {
  return (req: Request, res: Response, next: NextFunction) => {
    const scopes = req.auth?.scopes ?? [];

    if (!scopes.includes(scope)) {
      return res.status(403).json({ error: "Forbidden", requiredScope: scope });
    }

    next();
  };
}
