import { supabaseAnon, supabaseAdmin } from "./supabase";

export async function requireUser(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new Error("Missing Authorization bearer token");
  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data?.user) throw new Error("Invalid token");
  return data.user;
}

export async function getUserCompanies(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("company_memberships")
    .select("company_id, role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getActiveCompanyId(userId: string) {
  const { data: prof } = await supabaseAdmin
    .from("profiles")
    .select("active_company_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (prof?.active_company_id) {
    const activeCompanyId = prof.active_company_id as string;

    // Validate that the user is still a member of the active company.
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("company_memberships")
      .select("company_id")
      .eq("user_id", userId)
      .eq("company_id", activeCompanyId)
      .maybeSingle();

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    if (membership) {
      return activeCompanyId;
    }

    // Clear stale active_company_id if the membership no longer exists.
    const { error: clearError } = await supabaseAdmin
      .from("profiles")
      .update({ active_company_id: null })
      .eq("user_id", userId);

    if (clearError) {
      throw new Error(clearError.message);
    }
  }
  const companies = await getUserCompanies(userId);
  const first = companies[0]?.company_id;
  if (!first) return null;

  await supabaseAdmin.from("profiles").upsert({ user_id: userId, active_company_id: first });
  return first as string;
}

export async function requireActiveCompany(req: Request) {
  const user = await requireUser(req);
  const activeCompanyId = await getActiveCompanyId(user.id);
  if (!activeCompanyId) throw new Error("No company membership");
  return { user, activeCompanyId };
}
