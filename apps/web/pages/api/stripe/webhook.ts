import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { audit } from "@/lib/gating";

type ResponseData = {
  received?: boolean;
  error?: string;
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function mapStripeStatus(
  status: string,
): "trial" | "active" | "past_due" | "suspended" | "canceled" {
  if (status === "active") {
    return "active";
  }

  if (status === "past_due") {
    return "past_due";
  }

  if (status === "canceled") {
    return "canceled";
  }

  return "trial";
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!webhookSecret) {
    return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is not set" });
  }

  const sig = req.headers["stripe-signature"];

  if (!sig || Array.isArray(sig)) {
    return res.status(400).json({ error: "Missing stripe-signature" });
  }

  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(400).json({ error: `Webhook error: ${message}` });
  }

  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as {
      id: string;
      customer: string | number;
      status: string;
      current_period_start?: number;
      current_period_end?: number;
    };

    const customerId = String(sub.customer);
    const mapped = mapStripeStatus(String(sub.status));

    const { data: billing } = await supabaseAdmin
      .from("company_billing")
      .select("company_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (billing?.company_id) {
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
        .eq("company_id", billing.company_id);

      await supabaseAdmin
        .from("company_features")
        .update({
          enable_ai_automation: mapped === "active",
          enable_checkout: mapped !== "canceled",
        })
        .eq("company_id", billing.company_id);

      await audit(billing.company_id, null, "billing.subscription_updated", {
        status: mapped,
        stripeSubscriptionId: sub.id,
      });
    }

    return res.status(200).json({ received: true });
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as { customer: string | number };
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
        await audit(billing.company_id, null, "billing.invoice_paid", {});
      } else {
        await supabaseAdmin
          .from("company_billing")
          .update({ status: "past_due" })
          .eq("company_id", billing.company_id);
        await supabaseAdmin
          .from("company_features")
          .update({ enable_ai_automation: false })
          .eq("company_id", billing.company_id);
        await audit(billing.company_id, null, "billing.invoice_payment_failed", {});
      }
    }

    return res.status(200).json({ received: true });
  }

  return res.status(200).json({ received: true });
}

function buffer(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}
