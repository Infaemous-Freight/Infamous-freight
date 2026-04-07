import { ApiError } from "../utils/errors.js";

export function requireTenantContext(tenantId?: string | null): string {
  if (!tenantId || tenantId.trim().length === 0) {
    throw new ApiError(400, "TENANT_CONTEXT_REQUIRED", "tenantId context is required");
  }

  return tenantId;
}

export function withTenantWhere<T extends Record<string, unknown>>(
  tenantId: string,
  where: T = {} as T,
): T & { tenantId: string } {
  return {
    ...where,
    tenantId: requireTenantContext(tenantId),
  };
}
