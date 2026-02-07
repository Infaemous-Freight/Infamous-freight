const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit = 120, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true } as const;
  }
  if (b.count >= limit) return { ok: false, retryAfterMs: b.reset - now } as const;
  b.count++;
  return { ok: true } as const;
}
