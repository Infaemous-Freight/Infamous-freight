/**
 * Placeholder Genesis factory for API workspace.
 *
 * Security:
 * - Requires tenant-scoped auth input.
 * - Never creates cross-tenant Genesis clients.
 */
export function makeGenesis(auth: { tenantId: string; sub: string; role: any }) {
  // The Genesis integration is not yet wired into the API workspace.
  // Once @infamous-freight/genesis is added as a proper dependency (workspace:*),
  // this function should be updated to delegate to createGenesis.
  throw new Error(
    `makeGenesis is not available in apps/api: @infamous-freight/genesis is not wired in for tenant ${auth.tenantId} and user ${auth.sub}.`
  );
}
