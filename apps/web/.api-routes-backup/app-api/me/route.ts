import { requireUser, getUserCompanies, getActiveCompanyId } from "@/lib/auth-server";
import { jsonWithRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const companies = await getUserCompanies(user.id);
    const activeCompanyId = await getActiveCompanyId(user.id);
    return jsonWithRequestId(req, {
      userId: user.id,
      companies,
      activeCompanyId,
    });
  } catch (err: unknown) {
    const anyErr = err as { status?: number; statusCode?: number; message?: string };
    const status =
      typeof anyErr.status === "number"
        ? anyErr.status
        : typeof anyErr.statusCode === "number"
          ? anyErr.statusCode
          : 500;
    const message =
      anyErr && typeof anyErr.message === "string" ? anyErr.message : "Internal Server Error";
    return jsonWithRequestId(req, { error: message }, { status });
  }
}
