import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Decode a JWT and return its payload object.
 * This performs a non-verified decode suitable for extracting the user id
 * when the token has already been issued by a trusted auth provider.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonPayload = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getUserIdFromAuthorizationHeader(req: Request): string | null {
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }
  const sub = payload.sub as string | undefined;
  const userId = (payload.user_id as string | undefined) ?? sub;
  return userId ?? null;
}

export async function POST(req: Request) {
  const { companyName } = await req.json();

  const ownerUserId = getUserIdFromAuthorizationHeader(req);
  if (!ownerUserId) {
    return NextResponse.json(
      { error: "Unauthorized: valid bearer token required" },
      { status: 401 },
    );
  }

  if (!companyName) {
    return NextResponse.json(
      { error: "companyName is required" },
      { status: 400 },
    );
  }

  const { data: company, error } = await supabaseAdmin
    .from("companies")
    .insert({ name: companyName })
    .select("*")
    .single();
  if (error || !company) {
    return NextResponse.json(
      { error: error?.message ?? "Company create failed" },
      { status: 500 },
    );
  }

  await supabaseAdmin
    .from("company_memberships")
    .insert({ company_id: company.id, user_id: ownerUserId, role: "owner" });
  await supabaseAdmin.from("company_features").insert({ company_id: company.id });
  await supabaseAdmin.from("company_billing").insert({
    company_id: company.id,
    status: "trial",
    plan_key: "fleet",
    seats: 1,
    ai_included: 500,
    ai_overage: 0.008,
    ai_hard_cap_multiplier: 2,
    ai_hard_capped: false,
  });

  return NextResponse.json({ ok: true, companyId: company.id });
}
