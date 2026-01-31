"use client";

import { useEffect, useMemo, useState } from "react";

import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AssignmentStatusRealtime({
  assignmentId,
  initialStatus,
}: {
  assignmentId: string;
  initialStatus: string;
}) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const channel = supabase
      .channel(`assignment:${assignmentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "assignments", filter: `id=eq.${assignmentId}` },
        (payload) => {
          const next = (payload.new as { status?: string })?.status;
          if (next) {
            setStatus(next);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, assignmentId]);

  return (
    <div className="inline-block rounded-full border border-gray-200 px-2 py-1 text-xs">
      {status}
    </div>
  );
}
