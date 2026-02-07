import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, getUserCompanies } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const Body = z.object({ companyId: z.string().uuid() });

export async function POST(req: Request) {
  const user = await requireUser(req);
  const { companyId } = Body.parse(await req.json());
  const companies = await getUserCompanies(user.id);
  if (!companies.some((c) => c.company_id === companyId)) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }
  await supabaseAdmin.from("profiles").upsert({ user_id: user.id, active_company_id: companyId });
  return NextResponse.json({ ok: true, activeCompanyId: companyId });
}
