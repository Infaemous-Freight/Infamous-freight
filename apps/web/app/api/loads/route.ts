import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const Create = z.object({
  reference: z.string().optional(),
  pickup_location: z.string().optional(),
  dropoff_location: z.string().optional(),
});

export async function GET(req: Request) {
  const { activeCompanyId } = await requireActiveCompany(req);
  const { data } = await supabaseAdmin
    .from("loads")
    .select("*")
    .eq("company_id", activeCompanyId)
    .order("created_at", { ascending: false });
  return NextResponse.json({ ok: true, loads: data ?? [] });
}

export async function POST(req: Request) {
  const { user, activeCompanyId } = await requireActiveCompany(req);
  const body = Create.parse(await req.json());
  const { data, error } = await supabaseAdmin
    .from("loads")
    .insert({ company_id: activeCompanyId, created_by: user.id, ...body })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, load: data });
}
