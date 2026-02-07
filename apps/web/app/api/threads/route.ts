import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const Create = z.object({ loadId: z.string().uuid().optional() });

export async function GET(req: Request) {
  const { activeCompanyId } = await requireActiveCompany(req);
  const url = new URL(req.url);
  const loadId = url.searchParams.get("loadId");

  let query = supabaseAdmin
    .from("threads")
    .select("*")
    .eq("company_id", activeCompanyId)
    .order("created_at", { ascending: false });

  if (loadId) query = query.eq("load_id", loadId);

  const { data } = await query;
  return NextResponse.json({ ok: true, threads: data ?? [] });
}

export async function POST(req: Request) {
  const { activeCompanyId } = await requireActiveCompany(req);
  const body = Create.parse(await req.json());
  const { data, error } = await supabaseAdmin
    .from("threads")
    .insert({ company_id: activeCompanyId, load_id: body.loadId ?? null })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, thread: data });
}
