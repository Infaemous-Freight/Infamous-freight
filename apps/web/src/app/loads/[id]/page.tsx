import { notFound } from "next/navigation";

import BidsRealtime from "@/components/BidsRealtime";
import { supabaseServer } from "@/lib/supabase/server";

type LoadRecord = {
  id: string;
  shipper_id: string;
  status: string;
  origin?: string | null;
  destination?: string | null;
};

type BidRow = {
  id: string;
  load_id: string;
  carrier_id: string;
  amount_cents: number;
  status: string;
  message: string | null;
  created_at: string;
};

export default async function LoadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: load, error: loadError } = await supabase
    .from("loads")
    .select("id, shipper_id, status, origin, destination")
    .eq("id", params.id)
    .single();

  if (loadError || !load) {
    notFound();
  }

  const { data: bids } = await supabase
    .from("bids")
    .select("id, load_id, carrier_id, amount_cents, status, message, created_at")
    .eq("load_id", load.id)
    .order("created_at", { ascending: false });

  const canAccept = !!user && user.id === load.shipper_id && load.status === "open";

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Load {load.id}</h1>
        <p className="text-sm text-gray-500">
          {load.origin ? `Origin: ${load.origin}` : "Origin pending"} ·{" "}
          {load.destination ? `Destination: ${load.destination}` : "Destination pending"}
        </p>
      </header>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Bids</h2>
        <BidsRealtime
          loadId={load.id}
          initialBids={(bids ?? []) as BidRow[]}
          canAccept={canAccept}
        />
      </div>
    </section>
  );
}
