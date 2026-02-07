import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { upsertSubscriptionItem } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function mapStripeStatus(s: string): "trial" | "active" | "past_due" | "suspended" | "canceled" {
  if (s === "active") return "active";
  if (s === "past_due") return "past_due";
  if (s === "canceled") return "canceled";
  return "trial";
}

export async function POST(req: Request) {
  const rl = rateLimit(`wh:${req.headers.get("x-forwarded-for") ?? "local"}`, 600, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    return NextResponse.json({ error: `Webhook error: ${e.message}` }, { status: 400 });
  }

  const { data: exists } = await supabaseAdmin
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();
  if (exists?.event_id) return NextResponse.json({ received: true });
  await supabaseAdmin.from("stripe_webhook_events").insert({ event_id: event.id });

  if (event.type.startsWith("customer.subscription.")) {
    const sub: any = event.data.object;
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
      for (const it of items) {
        const priceId = it.price?.id;
        const subItemId = it.id;
        if (priceId && subItemId) {
          await upsertSubscriptionItem(companyId, priceId, subItemId);
        }
      }
    }
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const inv: any = event.data.object;
    const customerId = String(inv.customer);

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
  return NextResponse.json({ received: true });
}
