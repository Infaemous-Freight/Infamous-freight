import { NextResponse } from "next/server";
import { requireUser, getUserCompanies, getActiveCompanyId } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser(req);
  const companies = await getUserCompanies(user.id);
  const activeCompanyId = await getActiveCompanyId(user.id);
  return NextResponse.json({ userId: user.id, companies, activeCompanyId });
}
