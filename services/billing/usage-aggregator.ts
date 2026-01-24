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
export async function computeOverageForTenant(params: {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  includedTokenQuota: number;
}): Promise<UsageTotals> {
  void params;
  // TODO: query your event table(s)
  // Example outputs:
  return {
    ai_chat_1k_tokens: 0,
    ai_dispatch: 0,
    ai_invoice_audit: 0,
    ai_route_optimization: 0,
    ai_predictive_eta: 0,
    ai_fleet_health_scan: 0,
    ai_fraud_detection: 0,
    ai_load_match: 0,
  };
}