import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { jsonWithRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

const Create = z.object({
  reference: z.string().optional(),
  pickup_location: z.string().optional(),
  dropoff_location: z.string().optional(),
});

function mapErrorToResponse(
  err: unknown,
): { status: number; body: Record<string, unknown> } {
  const anyErr = err as any;

  const status: number =
    (typeof anyErr?.status === "number" && anyErr.status) ||
    (typeof anyErr?.statusCode === "number" && anyErr.statusCode) ||
    (err instanceof z.ZodError ? 400 : 500);

  if (err instanceof z.ZodError) {
    return {
      status,
      body: {
        error: "Invalid request body",
        details: err.flatten(),
      },
    };
  }

  return {
    status,
    body: {
      error: typeof anyErr?.message === "string" ? anyErr.message : "Internal Server Error",
    },
  };
}

export async function GET(req: Request) {
  try {
    const { activeCompanyId } = await requireActiveCompany(req);
    const { data } = await supabaseAdmin
      .from("loads")
      .select("*")
      .eq("company_id", activeCompanyId)
      .order("created_at", { ascending: false });
    return jsonWithRequestId(req, { ok: true, loads: data ?? [] });
  } catch (error) {
    // Fallback error handling to avoid unhandled promise rejections
    // and to provide a consistent JSON error response.
    // eslint-disable-next-line no-console
    console.error("GET /api/loads failed", error);
    const { status, body } = mapErrorToResponse(error);
    return jsonWithRequestId(req, body, { status });
  }
}

export async function POST(req: Request) {
  try {
    const { user, activeCompanyId } = await requireActiveCompany(req);
    const body = Create.parse(await req.json());

    const { data, error } = await supabaseAdmin
      .from("loads")
      .insert({ company_id: activeCompanyId, created_by: user.id, ...body })
      .select("*")
      .single();

    if (error)
      return jsonWithRequestId(req, { error: error.message }, { status: 400 });
    return jsonWithRequestId(req, { ok: true, load: data });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("POST /api/loads failed", error);
    const { status, body } = mapErrorToResponse(error);
    return jsonWithRequestId(req, body, { status });
  }
}
