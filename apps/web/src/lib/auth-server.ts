import { supabaseAnon, supabaseAdmin } from "@/lib/supabase";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function requireUser(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new AuthError("Authentication required", 401);

  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data?.user) throw new AuthError("Invalid or expired token", 401);
  return data.user;
}

export async function getUserCompanies(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || !data.organization_id) return [];

  return [
    {
      company_id: data.organization_id,
      // Role information is not stored on the users table; keep it nullable
      // to preserve the original return shape.
      role: null,
    },
  ];
}

export async function getActiveCompanyId(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("active_company_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.active_company_id) return profile.active_company_id as string;

  const companies = await getUserCompanies(userId);
  const first = companies[0]?.company_id;
  if (!first) return null;

  await supabaseAdmin.from("profiles").upsert({ user_id: userId, active_company_id: first });
  return first as string;
}

export async function requireActiveCompany(req: Request) {
  const user = await requireUser(req);
  const activeCompanyId = await getActiveCompanyId(user.id);
  if (!activeCompanyId) {
    throw new AuthError("No active company membership", 403);
  }
  return { user, activeCompanyId };
}
