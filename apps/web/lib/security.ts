// Security middleware for API routes
import type { NextApiRequest, NextApiResponse } from "next";

export interface SecurityHeaders {
  "X-Content-Type-Options": string;
  "X-Frame-Options": string;
  "X-XSS-Protection": string;
  "Strict-Transport-Security": string;
  "Content-Security-Policy": string;
  "Referrer-Policy": string;
  "Permissions-Policy": string;
}

export function setSecurityHeaders(res: NextApiResponse): void {
  const headers: SecurityHeaders = {
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // XSS Protection (legacy browsers)
    "X-XSS-Protection": "1; mode=block",

    // Force HTTPS
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

    // Content Security Policy
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-insights.com *.vercel-analytics.com *.sentry.io *.datadoghq.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' *.fly.dev *.vercel-insights.com *.vercel-analytics.com *.sentry.io *.datadoghq.com wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),

    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy (Feature Policy)
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=(self)",
      "payment=(self)",
    ].join(", "),
  };

  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export function withSecurity(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    setSecurityHeaders(res);
    return handler(req, res);
  };
}

// Rate limiting helper
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  req: NextApiRequest,
  options: { windowMs: number; max: number } = { windowMs: 60000, max: 100 },
): { allowed: boolean; remaining: number; resetTime: number } {
  const ip =
    (req.headers["x-forwarded-for"] as string) || (req.headers["x-real-ip"] as string) || "unknown";

  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    const resetTime = now + options.windowMs;
    requestCounts.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: options.max - 1, resetTime };
  }

  if (record.count >= options.max) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return {
    allowed: true,
    remaining: options.max - record.count,
    resetTime: record.resetTime,
  };
}

// Cleanup old rate limit entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, record] of requestCounts.entries()) {
      if (now > record.resetTime) {
        requestCounts.delete(ip);
      }
    }
  },
  5 * 60 * 1000,
);
