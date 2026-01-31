"use client";

import { useEffect, useMemo, useState } from "react";

import BidList from "@/components/BidList";
import { supabaseBrowser } from "@/lib/supabase/browser";

type BidRow = {
  id: string;
  load_id: string;
  carrier_id: string;
  amount_cents: number;
  status: string;
  message: string | null;
  created_at: string;
};

export default function BidsRealtime({
  loadId,
  initialBids,
  canAccept,
}: {
  loadId: string;
  initialBids: BidRow[];
  canAccept: boolean;
}) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [bids, setBids] = useState<BidRow[]>(initialBids);

  useEffect(() => {
    const channel = supabase
      .channel(`bids:${loadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bids", filter: `load_id=eq.${loadId}` },
        async () => {
          const { data } = await supabase
            .from("bids")
            .select("id, load_id, carrier_id, amount_cents, status, message, created_at")
            .eq("load_id", loadId)
            .order("created_at", { ascending: false });

          setBids((data as BidRow[]) ?? []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadId]);

  return <BidList bids={bids} canAccept={canAccept} />;
}
