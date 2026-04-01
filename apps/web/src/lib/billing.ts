import { supabaseAdmin } from "@/lib/supabase";
import { getStripeClient } from "@/lib/stripe";

export async function ensureStripeCustomer(companyId: string, companyName: string) {
  const { data: billing } = await supabaseAdmin
    .from("company_billing")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (!billing) throw new Error("company_billing missing");

  if (billing.stripe_customer_id) return billing.stripe_customer_id as string;

  const customer = await getStripeClient().customers.create({
    name: companyName,
    metadata: { company_id: companyId },
  });

  await supabaseAdmin
    .from("company_billing")
    .update({ stripe_customer_id: customer.id })
    .eq("company_id", companyId);

  return customer.id;
}

export async function upsertSubscriptionItem(
  companyId: string,
  priceId: string,
  subscriptionItemId: string,
) {
  await supabaseAdmin.from("stripe_subscription_items").upsert({
    company_id: companyId,
    price_id: priceId,
    subscription_item_id: subscriptionItemId,
    updated_at: new Date().toISOString(),
  });
}

export async function getSubscriptionItem(companyId: string, priceId: string) {
  const { data } = await supabaseAdmin
    .from("stripe_subscription_items")
    .select("subscription_item_id")
    .eq("company_id", companyId)
    .eq("price_id", priceId)
    .maybeSingle();

  return data?.subscription_item_id ?? null;
}
