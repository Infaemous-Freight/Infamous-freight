import { NextResponse } from "next/server";
import { Store } from "@/lib/store";
import { stripe } from "@/lib/stripe";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const body = (await req.json()) as { userId?: string; returnUrl?: string };

  // Authenticate request using JWT from Authorization header
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice("bearer ".length).trim();
  let authUserId: string | undefined;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      sub?: string;
      userId?: string;
    };
    authUserId = decoded.sub || decoded.userId;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!authUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If a userId is provided in the body, ensure it matches the authenticated user
  if (body.userId && body.userId !== authUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetUserId = body.userId ?? authUserId;
  if (!targetUserId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const user = Store.getUser(targetUserId);
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url:
      body.returnUrl ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000",
  });

  return NextResponse.json({ url: session.url });
}
