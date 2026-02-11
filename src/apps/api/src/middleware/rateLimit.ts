import { NextFunction, Request, Response } from "express";

type Bucket = {
  count: number;
  resetAt: number;
};

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 100;
const MIN_WINDOW_MS = 1_000;
const MIN_MAX_REQUESTS = 1;

function parseRateLimitEnv(
  value: string | undefined,
  fallback: number,
  minimum: number,
): number {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  // Only accept fully-numeric, non-negative integer strings; otherwise, fall back.
  if (!/^\d+$/.test(trimmed)) {
    return fallback;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(minimum, parsed);
}

const WINDOW_MS = parseRateLimitEnv(
  process.env.API_RATE_LIMIT_WINDOW_MS ??
    process.env.SALES_LEAD_CAPTURE_WINDOW_MS,
  DEFAULT_WINDOW_MS,
  MIN_WINDOW_MS,
);
const MAX_REQUESTS = parseRateLimitEnv(
  process.env.API_RATE_LIMIT_MAX_REQUESTS ??
    process.env.SALES_LEAD_CAPTURE_MAX_REQUESTS,
  DEFAULT_MAX_REQUESTS,
  MIN_MAX_REQUESTS,
);
const buckets = new Map<string, Bucket>();

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const bucket = buckets.get(key) ?? { count: 0, resetAt: now + WINDOW_MS };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + WINDOW_MS;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > MAX_REQUESTS) {
    const retry = Math.max(0, bucket.resetAt - now);
    res.setHeader("Retry-After", Math.ceil(retry / 1000));
    return res.status(429).json({ error: "Too many requests" });
  }

  return next();
}
