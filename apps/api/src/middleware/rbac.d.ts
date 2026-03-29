import type { RequestHandler } from "express";

export declare function requirePermission(permissions: string | string[]): RequestHandler;
export declare function requireRole(role: string | string[]): RequestHandler;
export declare function requireMinimumRole(role: string): RequestHandler;
export declare function validateResourceAccess(resource: string): RequestHandler;
export declare function auditAction(action: string): RequestHandler;
export declare function roleLimiter(options?: Record<string, unknown>): RequestHandler;
export declare const ROLE_HIERARCHY: Record<string, number>;
