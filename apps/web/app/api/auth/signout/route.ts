import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServer();

  try {
    await supabase.auth.signOut();

    const url = new URL(req.url);
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Error signing out user", error);
    return NextResponse.json(
      { error: "Failed to sign out. Please try again." },
      { status: 500 },
    );
  }
}
