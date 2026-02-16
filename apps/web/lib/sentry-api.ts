/**
 * Sentry API Route Handler
 * Use this to wrap API routes with automatic error tracking
 */

import type { NextApiRequest, NextApiResponse } from "next";
import * as Sentry from "@sentry/nextjs";

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  requestId?: string;
}

/**
 * Wrap an API route handler with Sentry error tracking
 * Automatically captures errors and adds request context
 *
 * @example
 * export default withSentryAPI(async (req, res) => {
 *   // Your API logic here
 *   res.json({ success: true });
 * });
 */
export function withSentryAPI(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Generate request ID for tracking
    const requestId = crypto.randomUUID();

    // Set request context for Sentry
    Sentry.setContext("request", {
      requestId,
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
      query: req.query,
    });

    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: "api",
      message: `${req.method} ${req.url}`,
      level: "info",
      data: {
        requestId,
        method: req.method,
        url: req.url,
      },
    });

    try {
      await handler(req, res);
    } catch (error) {
      // Capture error with context
      Sentry.captureException(error, {
        contexts: {
          request: {
            requestId,
            method: req.method,
            url: req.url,
          },
        },
        tags: {
          api: "true",
          method: req.method || "unknown",
        },
      });

      // Send error response
      const statusCode = getStatusCode(error);
      const message =
        process.env.NODE_ENV === "production" ? "Internal Server Error" : (error as Error).message;

      const errorResponse: ErrorResponse = {
        error: "API Error",
        message,
        statusCode,
        ...(process.env.NODE_ENV !== "production" && { requestId }),
      };

      res.status(statusCode).json(errorResponse);
    }
  };
}

/**
 * Sanitize headers to remove sensitive information
 */
function sanitizeHeaders(headers: NextApiRequest["headers"]): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveHeaders = ["authorization", "cookie", "x-api-key", "x-auth-token"];

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = Array.isArray(value) ? value.join(", ") : value || "";
    }
  }

  return sanitized;
}

function getStatusCode(error: unknown): number {
  if (typeof error !== "object" || error === null) return 500;
  const maybeError = error as { statusCode?: unknown };
  return typeof maybeError.statusCode === "number" ? maybeError.statusCode : 500;
}

/**
 * Track API performance
 * Use this to wrap slow API operations
 *
 * @example
 * await trackApiPerformance('database-query', async () => {
 *   return await db.query(...);
 * });
 */
export async function trackApiPerformance<T>(
  operationName: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await Sentry.startSpan(
    {
      name: operationName,
      op: "api.operation",
    },
    async () => {
      return await operation();
    },
  );
}
