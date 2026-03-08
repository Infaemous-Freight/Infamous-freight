import type { NextFunction, Request, Response } from "express";

export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth?.scopes?.includes(scope)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}
