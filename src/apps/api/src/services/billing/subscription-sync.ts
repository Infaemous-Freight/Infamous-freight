export async function upsertTenantBillingFromSubscription(
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  items: unknown,
  plan: unknown,
  tenantId: string,
): Promise<never> {
  const context = {
    stripeCustomerId,
    stripeSubscriptionId,
    tenantId,
    itemCount: Array.isArray(items) ? items.length : undefined,
    planType: typeof plan,
  };

  const error = new Error("unimplemented: upsertTenantBillingFromSubscription");
  // Attach detailed context for server-side logging/observability without leaking it to clients
  (error as any).context = context;
  throw error;
}
