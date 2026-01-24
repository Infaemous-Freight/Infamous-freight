import type { AiMeteredFeature } from "./pricing-map";

export type UsageTotals = Record<AiMeteredFeature, number>;

/**
 * Compute per-feature usage totals for a tenant over a billing period to determine billable overage.
 *
 * @param params.tenantId - Tenant identifier to aggregate usage for
 * @param params.periodStart - Inclusive start of the billing period
 * @param params.periodEnd - Exclusive end of the billing period
 * @param params.includedTokenQuota - Number of chat tokens included in the tenant's plan; used when calculating token overage
 * @returns A UsageTotals record mapping each `AiMeteredFeature` to its total usage for the specified period
 */
/**
 * @deprecated
 * This function is not the canonical source of billing usage/overage data.
 * Use the backend billing usage endpoints (backed by OrgUsage/OrgBilling in
 * api/src/billing/usage.ts) as the single source of truth instead.
 */
export async function computeOverageForOrganization(params: {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  includedTokenQuota: number;
}): Promise<UsageTotals> {
  // Prevent unused parameter warnings while making it clear this
  // implementation must not be used for real billing calculations.
  void params;

  throw new Error(
    "computeOverageForTenant is deprecated. Use the backend billing usage " +
      "implementation in api/src/billing/usage.ts (e.g., getUsageSummary) " +
      "as the single source of truth for billing calculations.",
  );
}