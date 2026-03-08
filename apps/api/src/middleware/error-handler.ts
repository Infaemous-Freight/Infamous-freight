import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  return res.status(500).json({ error: "Internal server error" });
}
