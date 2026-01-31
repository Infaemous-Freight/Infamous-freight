import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function supabaseMiddleware(req: NextRequest, res: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Environment variable NEXT_PUBLIC_SUPABASE_URL is not set. It must be defined to initialize the Supabase client in middleware.",
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. It must be defined to initialize the Supabase client in middleware.",
    );
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return { supabase, res };
}
