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

  throw new Error(
    "unimplemented: upsertTenantBillingFromSubscription " +
      JSON.stringify(context),
  );
}
