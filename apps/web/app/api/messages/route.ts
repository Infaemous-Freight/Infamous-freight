import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const Create = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1),
});

export async function GET(req: Request) {
  const { activeCompanyId } = await requireActiveCompany(req);
  const url = new URL(req.url);
  const threadId = url.searchParams.get("threadId");
  if (!threadId) {
    return NextResponse.json({ error: "threadId required" }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("company_id", activeCompanyId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ ok: true, messages: data ?? [] });
}

export async function POST(req: Request) {
  const { user, activeCompanyId } = await requireActiveCompany(req);
  const body = Create.parse(await req.json());
  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      company_id: activeCompanyId,
      thread_id: body.threadId,
      sender_user_id: user.id,
      body: body.body,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, message: data });
}
