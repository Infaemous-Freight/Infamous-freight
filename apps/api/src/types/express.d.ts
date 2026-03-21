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
        email: string;
        role: JwtAccessTokenPayload["role"];
        tenantId: string;
      };
      tenantId?: string;
      orgId?: string;
      organizationId?: string;
    }
  }
}

export {};
