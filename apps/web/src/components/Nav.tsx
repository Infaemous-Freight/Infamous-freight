import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Nav() {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  let role: string | null = null;
  if (auth.user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profileError) {
      // Log profile load failures so they don't fail silently but still fail closed for navigation
      console.error("Failed to load user profile role", {
        userId: auth.user.id,
        error: profileError.message,
        code: profileError.code,
      });
      role = null;
    } else {
      role = profile?.role ?? null;
    }
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold tracking-tight">
          Infæmous Freight
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/loads">Loads</Link>
          {auth.user && <Link href="/assignments">Assignments</Link>}
          {(role === "shipper" || role === "dispatcher" || role === "admin") && (
            <Link href="/loads/new" className="font-medium">
              Post Load
            </Link>
          )}
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
