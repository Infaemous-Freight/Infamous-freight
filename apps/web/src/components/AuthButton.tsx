import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AuthButton() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <Link href="/login" className="font-medium">
        Sign in
      </Link>
    );
  }

  return (
    <form action="/api/auth/signout" method="post">
      <button className="font-medium" type="submit">
        Sign out
      </button>
    </form>
  );
}
