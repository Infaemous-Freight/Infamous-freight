import { NextFunction, Request, Response } from 'express';

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed per window */
  max: number;
  /** Optional key prefix for namespacing counters */
  keyPrefix?: string;
}

interface CounterEntry {
  count: number;
  resetAt: number;
}

/**
 * Creates an in-memory rate limiter middleware.
 *
 * Each call returns a fresh middleware backed by its own counter store,
 * so separate app instances (e.g. in tests) never share state.
 */
export function createRateLimiter(config: RateLimitConfig): (req: Request, res: Response, next: NextFunction) => void {
  const store = new Map<string, CounterEntry>();
  const prefix = config.keyPrefix ?? 'rl';

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const clientId = getClientIdentifier(req);
    const key = `${prefix}:${clientId}`;
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 1, resetAt: now + config.windowMs };
      store.set(key, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, config.max - entry.count);
    const resetSecs = Math.ceil(entry.resetAt / 1000);

    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSecs);

    if (entry.count > config.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({
        statusCode: 429,
        error: 'rate_limit_exceeded',
        message: 'Too many requests. Please slow down and try again later.',
        retryAfter,
      });
      return;
    }

    next();
  };
}

/**
 * Reads rate-limit configuration from environment variables, falling back to
 * the supplied defaults when a variable is absent or unparseable.
 */
export function getRateLimitConfig(
  envMax: string,
  envWindowSeconds: string,
  defaultMax: number,
  defaultWindowMs: number,
  keyPrefix: string,
): RateLimitConfig {
  const max = parsePositiveInt(process.env[envMax], defaultMax);
  const windowMs = parsePositiveInt(process.env[envWindowSeconds], Math.ceil(defaultWindowMs / 1000)) * 1000;
  return { max, windowMs, keyPrefix };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim()) ??
    req.ip ??
    'unknown';
  return `ip:${ip}`;
}
