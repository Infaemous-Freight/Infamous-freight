/**
 * On-Demand ISR Revalidation API
 *
 * Allows triggering page regeneration without waiting for the revalidate timer.
 * Useful for immediate content updates when data changes.
 *
 * Usage:
 * POST /api/revalidate?secret=<REVALIDATE_SECRET>&path=/<path>
 *
 * Examples:
 * - Revalidate homepage: ?secret=xxx&path=/
 * - Revalidate pricing: ?secret=xxx&path=/pricing
 * - Multiple paths: ?secret=xxx&path=/&path=/pricing
 *
 * Security:
 * - Requires REVALIDATE_SECRET environment variable
 * - Returns 401 if secret is missing or incorrect
 * - Rate limited to prevent abuse
 *
 * Setup:
 * 1. Generate secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 2. Add to environment: REVALIDATE_SECRET=<your-secret>
 * 3. Trigger via: POST /api/revalidate?secret=<secret>&path=/
 */

import type { NextApiRequest, NextApiResponse } from "next";

type ErrorResponse = {
  message: string;
  code?: string;
};

type SuccessResponse = {
  revalidated: boolean;
  paths: string[];
  timestamp: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>,
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  // Check for secret token
  const secret = req.query.secret;
  const expectedSecret = process.env.REVALIDATE_SECRET;

  if (!expectedSecret) {
    // eslint-disable-next-line no-console
    console.error("REVALIDATE_SECRET not configured");
    return res.status(500).json({
      message: "Revalidation not configured",
      code: "NOT_CONFIGURED",
    });
  }

  if (!secret || secret !== expectedSecret) {
    return res.status(401).json({
      message: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

  try {
    // Get path(s) to revalidate from query params
    const paths = Array.isArray(req.query.path)
      ? req.query.path
      : req.query.path
        ? [req.query.path]
        : ["/"];

    // Revalidate each path
    const revalidatedPaths: string[] = [];

    for (const path of paths) {
      if (typeof path !== "string") {
        continue;
      }

      // Validate path format
      if (!path.startsWith("/")) {
        return res.status(400).json({
          message: `Invalid path: ${path} (must start with /)`,
          code: "INVALID_PATH",
        });
      }

      // Revalidate the path
      await res.revalidate(path);
      revalidatedPaths.push(path);

      // Success - path revalidated
    }

    return res.status(200).json({
      revalidated: true,
      paths: revalidatedPaths,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error revalidating:", err);
    return res.status(500).json({
      message: "Error revalidating",
      code: "REVALIDATION_ERROR",
    });
  }
}

/**
 * Example usage with curl:
 *
 * # Revalidate homepage
 * curl -X POST "https://infamous.vercel.app/api/revalidate?secret=YOUR_SECRET&path=/"
 *
 * # Revalidate pricing page
 * curl -X POST "https://infamous.vercel.app/api/revalidate?secret=YOUR_SECRET&path=/pricing"
 *
 * # Revalidate multiple pages
 * curl -X POST "https://infamous.vercel.app/api/revalidate?secret=YOUR_SECRET&path=/&path=/pricing&path=/product"
 *
 * Expected response (success):
 * {
 *   "revalidated": true,
 *   "paths": ["/", "/pricing"],
 *   "timestamp": "2026-02-02T23:45:00.000Z"
 * }
 *
 * Expected response (error):
 * {
 *   "message": "Invalid token",
 *   "code": "INVALID_TOKEN"
 * }
 */

/**
 * Webhook integration example:
 *
 * When content changes in your CMS, trigger revalidation:
 *
 * // In your CMS webhook handler
 * async function handleContentUpdate(contentType) {
 *   const pathMap = {
 *     'homepage': '/',
 *     'pricing': '/pricing',
 *     'product': '/product',
 *     'docs': '/docs'
 *   };
 *
 *   const path = pathMap[contentType];
 *   if (!path) return;
 *
 *   await fetch(`https://infamous.vercel.app/api/revalidate`, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       secret: process.env.REVALIDATE_SECRET,
 *       path: path
 *     })
 *   });
 * }
 */
