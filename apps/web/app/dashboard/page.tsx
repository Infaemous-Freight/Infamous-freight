"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { observeAuthState } from "@/lib/auth";
import { listLoads } from "@/lib/firestoreCrud";
import { reportSentryError } from "@/lib/sentry";
import type { Load } from "@/types";

const PAGE_SIZE = 25;

const LoadRow = memo(function LoadRow({ load }: { load: Load }) {
  return (
    <li>
      {load.lane} - ${(load.rateCents / 100).toFixed(2)} - {load.status}
    </li>
  );
});

export default function Dashboard() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const router = useRouter();
  const reloadRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let isMounted = true;
    let authEventSeq = 0;
    let currentUserId: string | null = null;

    const fetchForCurrentUser = async (seq: number) => {
      try {
        const loadDocs = await listLoads();
        if (!isMounted || seq !== authEventSeq) return;

        setLoads(loadDocs);
        setError(null);
      } catch (err) {
        if (!isMounted || seq !== authEventSeq) return;

        setLoads([]);
        reportSentryError(
          err instanceof Error ? err : new Error("Failed to load dashboard data"),
          {
            contexts: {
              component: "dashboard",
              action: "listLoads",
            },
          },
        );
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        if (!isMounted || seq !== authEventSeq) return;

        setLoading(false);
      }
    };

    reloadRef.current = () => {
      if (!currentUserId) return;
      const seq = ++authEventSeq;
      setLoading(true);
      setError(null);
      void fetchForCurrentUser(seq);
    };

    const unsubscribe = observeAuthState(async (user) => {
      const seq = ++authEventSeq;
      if (!isMounted) return;
      if (!user) {
        currentUserId = null;
        setLoads([]);
        setError(null);
        router.push("/login");
        setLoading(false);
        return;
      }

      currentUserId = user.uid ?? "authenticated";
      await fetchForCurrentUser(seq);
    });

    return () => {
      isMounted = false;
      reloadRef.current = () => undefined;
      unsubscribe();
    };
  }, [router]);

  const handleRetry = useCallback(() => {
    reloadRef.current();
  }, []);

  const visibleLoads = useMemo(() => loads.slice(0, visibleCount), [loads, visibleCount]);
  const hasMore = loads.length > visibleCount;

  const handleShowMore = useCallback(() => {
    setVisibleCount((current) => current + PAGE_SIZE);
  }, []);

  if (loading) return <div className="p-6">Loading dashboard...</div>;
  if (error)
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-3 rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Active Loads</h1>
      {loads.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No active loads.</p>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {visibleLoads.map((load) => (
              <LoadRow key={load.id} load={load} />
            ))}
          </ul>
          {hasMore && (
            <button
              type="button"
              onClick={handleShowMore}
              className="mt-4 rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
            >
              Show more ({loads.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}
