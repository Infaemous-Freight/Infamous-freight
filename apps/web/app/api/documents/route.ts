import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const Create = z.object({
  loadId: z.string().uuid().optional(),
  docType: z.string().default("pod"),
  fileName: z.string().min(1),
});

export async function GET(req: Request) {
  const { activeCompanyId } = await requireActiveCompany(req);
  const url = new URL(req.url);
  const loadId = url.searchParams.get("loadId");

  let query = supabaseAdmin
    .from("documents")
    .select("*")
    .eq("company_id", activeCompanyId)
    .order("created_at", { ascending: false });

  if (loadId) query = query.eq("load_id", loadId);

  const { data } = await query;
  return NextResponse.json({ ok: true, documents: data ?? [] });
}

export async function POST(req: Request) {
  const { user, activeCompanyId } = await requireActiveCompany(req);
  const body = Create.parse(await req.json());

  const safeName = body.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${activeCompanyId}/${body.loadId ?? "general"}/${randomUUID()}-${safeName}`;

  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from("documents")
    .createSignedUploadUrl(storagePath);

  if (signedError || !signed) {
    return NextResponse.json(
      { error: signedError?.message ?? "Failed to create upload URL" },
      { status: 500 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("documents")
    .insert({
      company_id: activeCompanyId,
      load_id: body.loadId ?? null,
      storage_path: storagePath,
      doc_type: body.docType,
      uploaded_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    document: data,
    upload: signed,
  });
}
