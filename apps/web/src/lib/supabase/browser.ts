import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getSupabasePublicKey } from "@/lib/supabase/env";

export function supabaseBrowser(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time or when Supabase is not configured, return a typed mock client

    console.warn(
      "Supabase environment variables not set (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). Using mock client.",
    );
    // Return a typed stub that preserves type safety
    return createBrowserClient<Database>(
      supabaseUrl || "http://localhost:54321",
      supabaseAnonKey || "mock-key",
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Re-export for compatibility
export { supabaseBrowser as default };
