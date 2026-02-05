import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { Store } from "@/lib/store";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    userId?: string;
    quantity?: number;
    action?: string;
  };

  if (!body.userId || !body.quantity) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const limiter = rateLimit(`report-usage:${body.userId}`, 30, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const sub = Store.getSub(body.userId);
  if (!sub) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const usage = Store.getUsage(body.userId);
  const hardCap = sub.aiIncluded * sub.hardCapMultiplier;

  if (sub.aiHardCapped || (hardCap > 0 && usage.actionsUsed >= hardCap)) {
    Store.updateSub(body.userId, { aiHardCapped: true });
    return NextResponse.json({ error: "Hard cap reached" }, { status: 403 });
  }

  const maxAllowed = hardCap > 0 ? hardCap : Infinity;
  const allowedQty = Math.min(body.quantity, Math.max(0, maxAllowed - usage.actionsUsed));
  if (allowedQty <= 0) {
    Store.updateSub(body.userId, { aiHardCapped: true });
    return NextResponse.json({ error: "Hard cap reached" }, { status: 403 });
  }

  const nextUsage = Store.incrementUsage(body.userId, allowedQty);
  const hardCapReached = hardCap > 0 && nextUsage.actionsUsed >= hardCap;

  if (sub.stripeMeteredItemId) {
    await stripe.subscriptionItems.createUsageRecord(sub.stripeMeteredItemId, {
      quantity: allowedQty,
      timestamp: Math.floor(Date.now() / 1000),
      action: "increment",
    });
  }

  if (hardCapReached) {
    Store.updateSub(body.userId, { aiHardCapped: true });
  }

  return NextResponse.json({
    ok: true,
    reported: allowedQty,
    used: nextUsage.actionsUsed,
    hardCapReached,
    action: body.action ?? "",
  });
}
