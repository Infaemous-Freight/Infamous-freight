import rateLimit from "express-rate-limit";

function buildLimiter(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: message },
    skip: (req) => req.method === "OPTIONS",
  });
}

export const authLimiter = buildLimiter(
  15 * 60 * 1000,
  (() => { const value = Number.parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? "5", 10); return Number.isFinite(value) && value > 0 ? value : 5; })(),
  "Too many authentication attempts. Try again later.",
);
export const trackingLimiter = buildLimiter(
  15 * 60 * 1000,
  Number(process.env.RATE_LIMIT_GENERAL_MAX ?? 100),
  "Too many requests. Please try again later.",
);
export const generalLimiter = trackingLimiter;
