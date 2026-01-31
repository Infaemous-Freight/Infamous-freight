import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  await supabase.auth.signOut();

  const url = new URL(req.url);
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}
