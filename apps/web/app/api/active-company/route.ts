import { z } from "zod";
import { requireUser, getUserCompanies } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { jsonWithRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

const Body = z.object({ companyId: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const { companyId } = Body.parse(await req.json());

    const companies = await getUserCompanies(user.id);
    if (!companies.some((company) => company.company_id === companyId)) {
      return jsonWithRequestId(req, { error: "Not a member of that company" }, { status: 403 });
    }

    await supabaseAdmin.from("profiles").upsert({
      user_id: user.id,
      active_company_id: companyId,
    });
    return jsonWithRequestId(req, { ok: true, activeCompanyId: companyId });
  } catch (err: unknown) {
    // Preserve Response-based control flow from helpers (e.g., redirects or auth failures)
    if (err instanceof Response) {
      throw err;
    }

    // Handle request validation errors explicitly
    if (err instanceof z.ZodError) {
      const details = typeof err.flatten === "function" ? err.flatten() : err.errors;
      return jsonWithRequestId(
        req,
        { error: "Invalid request body", details },
        { status: 400 },
      );
    }

    // Fallback for unexpected errors
    return jsonWithRequestId(
      req,
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
