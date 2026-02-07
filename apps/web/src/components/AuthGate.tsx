"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface AuthGateRenderProps {
  user: User;
  token: string;
}

export default function AuthGate({
  children,
}: {
  children: (props: AuthGateRenderProps) => React.ReactNode;
}) {
  const supabase = useMemo(() => supabaseBrowser, []);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setLoading(false);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return <div className="container">Loading authentication...</div>;
  }

  if (!user || !token) {
    return (
      <div className="container">
        <h1>Sign in required</h1>
        <p>Please sign in to continue onboarding or access dispatch.</p>
      </div>
    );
  }

  return <>{children({ user, token })}</>;
}
