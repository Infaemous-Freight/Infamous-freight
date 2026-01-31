import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Environment variable NEXT_PUBLIC_SUPABASE_URL is not set. " +
      "Please define it (e.g., in apps/web/.env or your deployment environment).",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. " +
      "Please define it (e.g., in apps/web/.env or your deployment environment).",
  );
}
export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options });
      }
    }
  });
}
