import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

import { getServerEnv, normalizeBaseUrl } from "@/lib/server-env";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

type CheckoutJwtPayload = JwtPayload & {
  sub?: string;
  email?: string;
  companyId?: string;
};

export async function POST(req: Request) {
  // Authenticate request using Bearer JWT
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  let payload: CheckoutJwtPayload;
  try {
    const secret = getServerEnv("JWT_SECRET");
    if (!secret) {
      return NextResponse.json({ error: "Server configuration error: missing JWT_SECRET" }, { status: 500 });
    }
    const decoded = jwt.verify(token, secret);
    if (typeof decoded !== "object" || !decoded) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }
    payload = decoded as CheckoutJwtPayload;
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // Basic validation of request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bodyRecord = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const priceId = typeof bodyRecord.priceId === "string" ? bodyRecord.priceId.trim() : "";

  // Validate Stripe price ID format (defensive check)
  if (!priceId || !/^price_[a-zA-Z0-9]+$/.test(priceId)) {
    return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
  }

  // Prepare metadata for linkage in webhook fulfillment
  const metadata: Record<string, string> = {};
  if (typeof payload.sub === "string") {
    metadata.userId = payload.sub;
  }
  if (typeof payload.companyId === "string") {
    metadata.companyId = payload.companyId;
  }

  const appUrl = getServerEnv("NEXT_PUBLIC_APP_URL");
  if (!appUrl) {
    return NextResponse.json(
      { error: "Server configuration error: missing NEXT_PUBLIC_APP_URL" },
      { status: 500 },
    );
  }

  const baseUrl = normalizeBaseUrl(appUrl);

  let session;
  try {
    session = await getStripeClient().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: Object.keys(metadata).length ? metadata : undefined,
      customer_email: typeof payload.email === "string" ? payload.email : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Unable to create checkout session" }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
