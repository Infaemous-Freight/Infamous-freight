import { NextFunction, Request, Response } from 'express';

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

function getClientKey(req: Request, keyPrefix: string): string {
  const forwardedFor = req.header('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwardedFor || req.ip || req.socket.remoteAddress || 'unknown';
  const tenantId = req.header('x-tenant-id')?.trim() || 'no-tenant';

  return `${keyPrefix}:${tenantId}:${ip}`;
}

function getPositiveIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getRateLimitOptions(keyPrefix: string): RateLimitOptions {
  return {
    keyPrefix,
    windowMs: getPositiveIntegerEnv('RATE_LIMIT_WINDOW_MS', 60_000),
    maxRequests: getPositiveIntegerEnv('RATE_LIMIT_MAX_REQUESTS', 120),
  };
}

export function createRateLimitMiddleware(keyPrefix = 'api') {
  const options = getRateLimitOptions(keyPrefix);

  return (req: Request, res: Response, next: NextFunction) => {
    const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED ?? process.env.API_RATE_LIMIT_ENABLED;
    if (rateLimitEnabled === 'false') {
      next();
      return;
    }

    const now = Date.now();
    const key = getClientKey(req, options.keyPrefix);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      next();
      return;
    }

    if (current.count >= options.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Too many requests. Try again after the retry window.',
      });
      return;
    }

    current.count += 1;
    buckets.set(key, current);
    next();
  };
}

export function resetRateLimitBucketsForTests() {
  buckets.clear();
}
