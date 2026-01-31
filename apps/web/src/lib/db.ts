import { supabaseServer } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Not authenticated");
  }

  return { supabase, user: data.user };
}

export async function getMyProfile() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Profile not found");
  }

  return data;
}
