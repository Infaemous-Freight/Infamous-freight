"use client";

import { useState } from "react";

type Bid = {
  id: string;
  amount_cents?: number | null;
  carrier_name?: string | null;
};

export default function BidList({ bids }: { bids: Bid[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function acceptBid(bidId: string) {
    setBusy(bidId);
    setErr(null);
    setOk(null);

    const res = await fetch("/api/actions/accept-bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bid_id: bidId }),
    });

    const json = await res.json();
    setBusy(null);

    if (!json.ok) return setErr(json.error || "Failed");

    if (json.thread_id) {
      window.location.href = `/threads/${json.thread_id}`;
      return;
    }

    setOk("Bid accepted.");
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      {bids.map((bid) => (
        <div key={bid.id} className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div className="text-sm font-semibold">{bid.carrier_name ?? "Carrier"}</div>
            <div className="text-xs text-gray-600">
              {typeof bid.amount_cents === "number"
                ? `$${(bid.amount_cents / 100).toFixed(2)}`
                : "Offer pending"}
            </div>
          </div>
          <button
            onClick={() => acceptBid(bid.id)}
            disabled={busy === bid.id}
            className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy === bid.id ? "Accepting..." : "Accept bid"}
          </button>
        </div>
      ))}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {ok && <p className="text-sm text-green-600">{ok}</p>}
      {bids.length === 0 && <p className="text-sm text-gray-600">No bids yet.</p>}
    </div>
  );
}
