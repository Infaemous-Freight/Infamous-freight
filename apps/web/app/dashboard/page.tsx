"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { observeAuthState } from "@/lib/auth";
import { listLoads } from "@/lib/firestoreCrud";
import { reportSentryError } from "@/lib/sentry";
import type { Load } from "@/types";

export default function Dashboard() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = observeAuthState(async (user) => {
      if (!isMounted) return;
      if (!user) {
        router.push("/login");
        setLoading(false);
        return;
      }

      try {
        const loadDocs = await listLoads();
        setLoads(loadDocs);
        setError(null);
      } catch (err) {
        reportSentryError(err instanceof Error ? err : new Error("Failed to load dashboard data"), {
          contexts: {
            component: "dashboard",
            action: "listLoads",
          },
        });
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  if (loading) return <div className="p-6">Loading dashboard...</div>;
  if (error)
    return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Active Loads</h1>
      <ul className="mt-4 space-y-2">
        {loads.map((load) => (
          <li key={load.id}>
            {load.lane} - ${(load.rateCents / 100).toFixed(2)} - {load.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
