"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { observeAuthState } from "@/lib/auth";
import { listLoads } from "@/lib/firestoreCrud";
import type { Load } from "@/types";

export default function Dashboard() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = observeAuthState(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const loadDocs = await listLoads();
      setLoads(loadDocs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Active Loads</h1>
      <ul className="mt-4 space-y-2">
        {loads.map((load) => (
          <li key={load.id}>
            {load.shipperName} - ${load.rate} - {load.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
