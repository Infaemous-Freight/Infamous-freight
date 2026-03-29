import type { RequestHandler } from "express";

export declare const limiters: Record<string, RequestHandler>;
export declare const rateLimit: RequestHandler;
export declare function createLimiter(
  name: string,
  options?: Record<string, unknown>,
): RequestHandler;
export declare function createTunedLimiter(
  name: string,
  options?: Record<string, unknown>,
): RequestHandler;
export declare const rateLimitMetrics: unknown;
export declare const authenticate: RequestHandler;
export declare const authenticateFlexible: RequestHandler;
export declare function requireScope(...scopes: string[]): RequestHandler;
export declare function requireOrganization(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
): void;
export declare function auditLog(action: string): RequestHandler;
export declare function validateUserOwnership(): RequestHandler;
