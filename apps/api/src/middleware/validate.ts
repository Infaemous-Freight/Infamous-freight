import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
    }

    req.body = parsed.data;
    return next();
  };
}
