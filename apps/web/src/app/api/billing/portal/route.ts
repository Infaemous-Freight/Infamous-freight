import { NextResponse } from "next/server";
import { Store } from "@/lib/store";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = (await req.json()) as { userId?: string; returnUrl?: string };
  if (!body.userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const user = Store.getUser(body.userId);
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: body.returnUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  });

  return NextResponse.json({ url: session.url });
}
