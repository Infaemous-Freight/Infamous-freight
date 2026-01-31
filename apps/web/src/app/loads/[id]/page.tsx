import BidList from "@/components/BidList";
import CreateBid from "@/components/CreateBid";
import { supabaseServer } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function LoadDetail({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const profile = await (async () => {
    try {
      return await getMyProfile();
    } catch (error: any) {
      if (error?.status === 401 || error?.message === "Unauthorized") {
        redirect("/sign-in");
      }
      throw error;
    }
  })();

  const { data: load, error: loadError } = await supabase
    .from("loads")
    .select("*")
    .eq("id", params.id)
    .single();

  if (loadError) {
    throw loadError;
  }

  const { data: bids, error: bidError } = await supabase
    .from("bids")
    .select("id, load_id, carrier_id, amount_cents, status, message, created_at")
    .eq("load_id", load.id)
    .order("created_at", { ascending: false });

  if (bidError) {
    throw bidError;
  }

  const canAccept = profile.id === load.shipper_id || profile.role === "admin";

  return (
    <div className="marketplace-stack">
      <div className="card marketplace-card">
        <div className="marketplace-card-header">
          <h1 className="marketplace-title">{load.title ?? "Untitled Load"}</h1>
          <div className="marketplace-chip">{load.status}</div>
        </div>
        <div className="marketplace-card-subtitle">
          {load.origin_city ?? "Origin"} -&gt; {load.destination_city ?? "Destination"}
        </div>
        <div className="marketplace-card-meta">
          Rate: <span className="marketplace-amount">${((load.rate_cents ?? 0) / 100).toFixed(2)}</span>
        </div>
      </div>

      <BidList bids={(bids ?? []) as any} canAccept={canAccept} />

      {(profile.role === "carrier" || profile.role === "owner_operator") &&
        load.status === "open" && <CreateBid loadId={load.id} />}

      <div className="card marketplace-card">
        <div className="marketplace-card-title">Open a Thread</div>
        <p className="marketplace-muted">
          After you accept a bid, create a thread between shipper and carrier to coordinate pickup and delivery.
        </p>
        <p className="marketplace-muted">
          Go to any thread directly: <span className="marketplace-mono">/threads/&lt;thread_id&gt;</span>
        </p>
      </div>
    </div>
  );
}
