import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicKey, getSupabasePublicKeyError } from "@/lib/supabase/env";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = getSupabasePublicKey();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Environment variable NEXT_PUBLIC_SUPABASE_URL is not set.");
}

if (!supabaseAnonKey) {
  throw new Error(getSupabasePublicKeyError("server index"));
}

if (!supabaseServiceRoleKey) {
  throw new Error("Environment variable SUPABASE_SERVICE_ROLE_KEY is not set.");
}

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Server-only: service role access
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
