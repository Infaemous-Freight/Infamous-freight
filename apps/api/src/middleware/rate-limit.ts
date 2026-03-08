import type { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis.js";

export function rateLimit(options: {
  windowSec: number;
  max: number;
  prefix: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.auth?.sub ?? req.ip ?? "anonymous";
    const key = `${options.prefix}:${identifier}`;

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, options.windowSec);
    }

    if (count > options.max) {
      return res.status(429).json({
        error: "Rate limit exceeded"
      });
    }

    return next();
  };
}
