import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { upsertSubscriptionItem } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
import { jsonWithRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

function mapStripeStatus(
  s: Stripe.Subscription.Status,
): "trial" | "active" | "past_due" | "suspended" | "canceled" {
  switch (s) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
    case "trialing":
    case "unpaid":
    case "paused":
    default:
      // Treat all other or future statuses as "trial" to preserve existing behavior.
      return "trial";
  }
}

export async function POST(req: Request) {
  const rl = rateLimit("wh:stripe-webhook", 600, 60_000);
  if (!rl.ok) {
    return jsonWithRequestId(req, { error: "Rate limited" }, { status: 429 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return jsonWithRequestId(req, { error: "Missing stripe-signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return jsonWithRequestId(
      req,
      { error: "STRIPE_WEBHOOK_SECRET not configured on server" },
      { status: 500 },
    );
  }

  const rawBody = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return jsonWithRequestId(req, { error: `Webhook error: ${message}` }, { status: 400 });
  }

  const { data: exists } = await supabaseAdmin
    .from("stripe_webhook_events")
    .select("event_id, processed_at")
    .eq("event_id", event.id)
    .maybeSingle();

  if (exists?.event_id) {
    if (!exists.processed_at) {
      return jsonWithRequestId(req, { received: true, status: "processing" });
    }

    return jsonWithRequestId(req, { received: true, status: "processed" });
  }
  await supabaseAdmin.from("stripe_webhook_events").insert({ event_id: event.id });

  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = String(sub.customer);
    const mapped = mapStripeStatus(String(sub.status));

    const { data: billing } = await supabaseAdmin
      .from("company_billing")
      .select("company_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    const companyId = billing?.company_id ?? sub.metadata?.company_id ?? null;

    if (companyId) {
      await supabaseAdmin
        .from("company_billing")
        .update({
          status: mapped,
          stripe_subscription_id: sub.id,
          current_period_start: sub.current_period_start
            ? new Date(sub.current_period_start * 1000).toISOString()
            : null,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
        })
        .eq("company_id", companyId);

      await supabaseAdmin
        .from("company_features")
        .update({
          enable_ai_automation: mapped === "active",
          enable_checkout: mapped !== "canceled",
        })
        .eq("company_id", companyId);

      const items = sub.items?.data ?? [];
      for (const item of items) {
        const priceId = item.price?.id;
        const subItemId = item.id;
        if (priceId && subItemId) {
          await upsertSubscriptionItem(companyId, priceId, subItemId);
        }
      }
    } else {
      console.warn(
        "[stripe:webhook] Unable to resolve company_id for subscription event",
        {
          eventType: event.type,
          subscriptionId: sub.id,
          customerId,
          billingCompanyId: billing?.company_id ?? null,
          metadataCompanyId: sub.metadata?.company_id ?? null,
        },
      );
    }
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = String(invoice.customer);

    const { data: billing } = await supabaseAdmin
      .from("company_billing")
      .select("company_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (billing?.company_id) {
      if (event.type === "invoice.paid") {
        await supabaseAdmin
          .from("company_billing")
          .update({ status: "active" })
          .eq("company_id", billing.company_id);
        await supabaseAdmin
          .from("company_features")
          .update({ enable_ai_automation: true })
          .eq("company_id", billing.company_id);
      } else {
        await supabaseAdmin
          .from("company_billing")
          .update({ status: "past_due" })
          .eq("company_id", billing.company_id);
        await supabaseAdmin
          .from("company_features")
          .update({ enable_ai_automation: false })
          .eq("company_id", billing.company_id);
      }
    }
  }

  await supabaseAdmin
    .from("stripe_webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("event_id", event.id);
  return jsonWithRequestId(req, { received: true });
}
