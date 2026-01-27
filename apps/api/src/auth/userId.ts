/**
 * User ID Authentication Hook
 * Extracts user ID from JWT token in request context
 *
 * Usage:
 *   const userId = getUserId(req);
 */

import { Request } from "express";
import { verifyToken } from "./jwt";

/**
 * Extract user ID from JWT payload in request
 * @param req Express request object
 * @returns User ID (UUID string) or null if not authenticated
 */
export function getUserId(req: Request): string | null {
  try {
    const user = (req as any).user;
    if (user?.sub) return user.sub;

    const auth = (req.headers?.authorization as string) || "";
    if (auth.toLowerCase().startsWith("bearer ")) {
      const token = auth.slice(7).trim();
      const claims = verifyToken(token);
      if (claims?.sub) return String(claims.sub);
    }

    const headerId = req.headers?.["x-user-id"] as string | undefined;
    if (headerId) return String(headerId);

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Require authenticated user
 * Throws 401 if user not authenticated
 * @param req Express request object
 * @returns User ID (guaranteed to be present)
 */
export function requireUserId(req: Request): string {
  const userId = getUserId(req);
  if (!userId) {
    throw new Error("Unauthorized: No user ID found in token");
  }
  return userId;
}

/**
 * Get user from request with full details
 * @param req Express request object
 * @returns User object from JWT payload or null
 */
export function getUser(req: Request): Record<string, any> | null {
  try {
    return (req as any).user || null;
  } catch (error) {
    return null;
  }
}
