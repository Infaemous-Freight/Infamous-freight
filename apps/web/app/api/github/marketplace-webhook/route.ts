import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";

type MarketplaceAccount = {
  id?: number;
  login?: string;
  type?: string;
};

type MarketplacePlan = {
  id?: number;
  name?: string;
  monthly_price_in_cents?: number;
  yearly_price_in_cents?: number;
  price_model?: string;
  unit_name?: string | null;
};

type MarketplacePurchase = {
  account?: MarketplaceAccount;
  billing_cycle?: string;
  unit_count?: number;
  on_free_trial?: boolean;
  free_trial_ends_on?: string | null;
  next_billing_date?: string | null;
  plan?: MarketplacePlan;
};

type MarketplaceEventPayload = {
  action?: string;
  sender?: {
    login?: string;
    id?: number;
    type?: string;
  };
  marketplace_purchase?: MarketplacePurchase;
  effective_date?: string;
  installation?: {
    id?: number;
  };
  repositories?: Array<{
    id?: number;
    name?: string;
    full_name?: string;
  }>;
  zen?: string;
  hook_id?: number;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function verifyGithubSignature(
  rawBody: string,
  signature256: string | null,
  secret: string,
): boolean {
  if (!signature256) return false;

  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signature256, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

async function upsertMarketplaceAccount(payload: MarketplaceEventPayload) {
  const purchase = payload.marketplace_purchase;
  const account = purchase?.account;
  const plan = purchase?.plan;

  const record = {
    githubAccountId: account?.id ?? null,
    githubLogin: account?.login ?? null,
    githubAccountType: account?.type ?? null,
    action: payload.action ?? null,
    planName: plan?.name ?? null,
    planId: plan?.id ?? null,
    billingCycle: purchase?.billing_cycle ?? null,
    unitCount: purchase?.unit_count ?? null,
    onFreeTrial: purchase?.on_free_trial ?? null,
    freeTrialEndsOn: purchase?.free_trial_ends_on ?? null,
    nextBillingDate: purchase?.next_billing_date ?? null,
    senderLogin: payload.sender?.login ?? null,
    installationId: payload.installation?.id ?? null,
    effectiveDate: payload.effective_date ?? null,
    receivedAt: new Date().toISOString(),
  };

  console.log("[marketplace] upsert subscription record", record);

  return record;
}

async function handleMarketplacePurchaseEvent(payload: MarketplaceEventPayload) {
  const action = payload.action ?? "unknown";

  switch (action) {
    case "purchased":
    case "changed":
    case "pending_change":
    case "pending_change_cancelled":
    case "cancelled":
      await upsertMarketplaceAccount(payload);
      break;
    default:
      console.log("[marketplace] unhandled action, acknowledged safely:", action);
      break;
  }
}

export async function POST(request: NextRequest) {
  try {
    const secret = getRequiredEnv("GITHUB_MARKETPLACE_WEBHOOK_SECRET");
    const rawBody = await request.text();
    const headersList = await headers();

    const signature256 = headersList.get("x-hub-signature-256");
    const githubEvent = headersList.get("x-github-event");
    const deliveryId = headersList.get("x-github-delivery");

    const isValid = verifyGithubSignature(rawBody, signature256, secret);

    if (!isValid) {
      console.error("[marketplace] invalid signature", { githubEvent, deliveryId });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as MarketplaceEventPayload;

    console.log("[marketplace] incoming event", {
      githubEvent,
      deliveryId,
      action: payload.action ?? null,
    });

    if (githubEvent === "ping") {
      return NextResponse.json(
        {
          ok: true,
          type: "ping",
          zen: payload.zen ?? "Webhook reachable",
        },
        { status: 200 },
      );
    }

    if (githubEvent === "marketplace_purchase") {
      await handleMarketplacePurchaseEvent(payload);

      return NextResponse.json(
        {
          ok: true,
          type: "marketplace_purchase",
          action: payload.action ?? null,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        ignored: true,
        event: githubEvent,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[marketplace] webhook failure", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Webhook handler failed",
      },
      { status: 500 },
    );
  }
}
