/**
 * Express Request/Response Type Extensions
 *
 * This file extends the Express Request interface with custom properties
 * used throughout the application to avoid TypeScript 'any' types.
 */

declare global {
  namespace Express {
    interface Request {
      /**
       * Authentication context set by auth middleware
       */
      auth?: {
        userId: string;
        orgId: string;
        organizationId: string;
        scopes: string[];
        role?: string;
      };

      /**
       * Request ID for distributed tracing (set by request-id middleware)
       */
      requestId?: string;

      /**
       * Rate limiting information (set by rate limit middleware)
       */
      rateLimit?: {
        limit: number;
        remaining: number;
        resetAt: Date;
        resetTime: number;
      };

      /**
       * Organization context (set by requireOrganization middleware)
       */
      organization?: {
        id: string;
        name: string;
        isActive: boolean;
        tier?: string;
      };

      /**
       * User context (set by authentication middleware)
       */
      user?: {
        id: string;
        email: string;
        name?: string;
        role?: string;
      };

      /**
       * Tenant ID for multi-tenancy (set by tenant middleware)
       */
      tenantId?: string;

      /**
       * Correlation ID for distributed tracing
       */
      correlationId?: string;

      /**
       * Request start time for performance tracking
       */
      startTime?: number;
    }
  }
}

export {};
