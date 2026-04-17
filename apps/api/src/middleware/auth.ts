import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors.js";
import { verifyAccessToken } from "../modules/auth/auth.utils.js";

export type AuthenticatedRequest = Request;

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    next(new ApiError(401, "AUTH_REQUIRED", "Authentication required"));
    return;
  }

  try {
    const claims = verifyAccessToken(authorization.slice(7));

    // Best-effort extraction of tenant / organization identifiers from JWT claims.
    // We intentionally avoid defaulting to empty strings to prevent accidental
    // "no-tenant" scopes in downstream handlers.
    const claimsAny = claims as any;
    const claimTenantId: string | undefined =
      claimsAny.tenantId ?? claimsAny.organizationId ?? claimsAny.orgId;
    const claimOrganizationId: string | undefined =
      claimsAny.organizationId ?? claimsAny.orgId ?? claimTenantId;
    const claimOrgId: string | undefined =
      claimsAny.orgId ?? claimsAny.organizationId ?? claimTenantId;

    req.auth = {
      userId: claims.sub,
      role: claims.role,
      tokenType: claims.type,
      organizationId: claimOrganizationId,
      orgId: claimOrgId,
    };
    req.user = {
      id: claims.sub,
      sub: claims.sub,
      email: claims.email ?? "",
      role: claims.role,
      tenantId: claimTenantId,
    };
    req.tenantId = claimTenantId;
    req.orgId = claimOrgId;
    req.organizationId = claimOrganizationId;

    next();
  } catch {
    next(new ApiError(401, "INVALID_ACCESS_TOKEN", "Invalid or expired access token"));
  }
}

export function requireTenantContext(req: Request, _res: Response, next: NextFunction): void {
  const tenantId = req.user?.tenantId ?? req.auth?.organizationId ?? req.tenantId;
  if (!tenantId || !req.auth) {
    next(new ApiError(403, "TENANT_CONTEXT_REQUIRED", "Tenant context is required"));
    return;
  }

  req.user = {
    ...req.user,
    id: req.user?.id ?? req.auth?.userId ?? "",
    sub: req.user?.sub ?? req.auth?.userId ?? "",
    email: req.user?.email ?? "",
    role: req.user?.role ?? req.auth.role,
    tenantId,
  };
  req.tenantId = tenantId;
  next();
}

export function getRequiredTenantId(req: Request): string {
  const tenantId = req.user?.tenantId ?? req.tenantId;
  if (!tenantId) {
    throw new ApiError(403, "TENANT_CONTEXT_REQUIRED", "Tenant context is required");
  }
  return tenantId;
}
