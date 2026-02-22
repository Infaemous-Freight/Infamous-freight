"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AuthButton(): React.ReactElement {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => setAuthed(!!data.session));

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setAuthed(!!session);
      },
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  if (!authed) {
    return (
      <Link href="/auth/sign-in" className="btn btn-tertiary">
        Sign in
      </Link>
    );
  }

  return (
    <form action="/api/auth/signout" method="post">
      <button className="btn btn-secondary" type="submit">
        Sign out
      </button>
    </form>
  );
}
