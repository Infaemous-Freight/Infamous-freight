import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureStripeCustomer } from "@/lib/billing";
import { stripe } from "@/lib/stripe";
import { jsonWithRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

const Body = z.object({
  plan: z.enum(["operator", "fleet"]),
  seats: z.number().int().min(1).max(500).default(1),
});

export async function POST(req: Request) {
  try {
    const { user, activeCompanyId } = await requireActiveCompany(req);
    const { plan, seats } = Body.parse(await req.json());

    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", activeCompanyId)
      .single();
    const customerId = await ensureStripeCustomer(
      activeCompanyId,
      company?.name ?? "Company",
    );

    const priceId =
      plan === "operator"
        ? process.env.STRIPE_PRICE_OPERATOR!
        : process.env.STRIPE_PRICE_FLEET!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: seats }],
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/pricing?billing=cancel`,
      subscription_data: {
        metadata: { company_id: activeCompanyId },
      },
      metadata: { company_id: activeCompanyId, actor_user_id: user.id },
    });

    return jsonWithRequestId(req, { ok: true, url: session.url });
  } catch (error) {
    console.error("Error creating billing checkout session", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
