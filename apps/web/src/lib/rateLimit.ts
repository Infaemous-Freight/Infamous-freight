const bucket = new Map<string, { resetAt: number; count: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = bucket.get(key);

  if (!existing || now > existing.resetAt) {
    bucket.set(key, { resetAt: now + windowMs, count: 1 });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  bucket.set(key, existing);
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}
