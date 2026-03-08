import type { NextFunction, Request, Response } from "express";

export function validateBody(_schema: unknown) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
}
