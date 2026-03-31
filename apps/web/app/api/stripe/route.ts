import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!stripe) {
    return new NextResponse("Stripe is not configured", { status: 503 });
  }

  // Authenticate request using Bearer JWT
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  let payload: any;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Server configuration error: missing JWT secret" },
        { status: 500 },
      );
    }
    payload = jwt.verify(token, secret);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // Basic validation of request body
  const body = await req.json();
  const priceId = typeof body?.priceId === "string" ? body.priceId.trim() : "";

  // Validate Stripe price ID format (defensive check)
  if (!priceId || !/^price_[a-zA-Z0-9]+$/.test(priceId)) {
    return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
  }

  // Prepare metadata for linkage in webhook fulfillment
  const metadata: Record<string, string> = {};
  if (payload && typeof payload === "object") {
    if (typeof payload.sub === "string") {
      metadata.userId = payload.sub;
    }
    if (typeof (payload as any).companyId === "string") {
      metadata.companyId = (payload as any).companyId;
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: Object.keys(metadata).length ? metadata : undefined,
    customer_email:
      payload && typeof payload === "object" && typeof (payload as any).email === "string"
        ? (payload as any).email
        : undefined,
  });

  return NextResponse.json({ url: session.url });
}
