import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const Create = z.object({
  loadId: z.string().uuid(),
  status: z.string().min(1),
  note: z.string().optional(),
});

export async function GET(req: Request) {
  const { activeCompanyId } = await requireActiveCompany(req);
  const url = new URL(req.url);
  const loadId = url.searchParams.get("loadId");
  if (!loadId) {
    return NextResponse.json({ error: "loadId required" }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from("status_events")
    .select("*")
    .eq("company_id", activeCompanyId)
    .eq("load_id", loadId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ ok: true, events: data ?? [] });
}

export async function POST(req: Request) {
  const { user, activeCompanyId } = await requireActiveCompany(req);
  const body = Create.parse(await req.json());
  const { data, error } = await supabaseAdmin
    .from("status_events")
    .insert({
      company_id: activeCompanyId,
      load_id: body.loadId,
      status: body.status,
      note: body.note ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, event: data });
}
