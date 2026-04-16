import type { JwtAccessTokenPayload } from "../modules/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: JwtAccessTokenPayload["role"];
        tokenType: JwtAccessTokenPayload["type"];
        organizationId?: string;
        orgId?: string;
      };
      user?: {
        id: string;
        /** JWT subject — same as id */
        sub: string;
        email: string;
        name?: string;
        role: JwtAccessTokenPayload["role"];
        tenantId?: string;
        tenant_id?: string;
        organizationId?: string;
        /** Comma-separated or array of OAuth scopes */
        scopes?: string | string[];
        permissions?: string[];
        locale?: string;
        tier?: string;
        profile?: Record<string, unknown>;
        /** JWT expiry (Unix timestamp) */
        exp?: number;
        /** Referral code — set by referral middleware */
        referral_code?: string;
      };
      tenantId?: string;
      orgId?: string;
      organizationId?: string;
      requestId?: string;
    }
  }
}

export {};
