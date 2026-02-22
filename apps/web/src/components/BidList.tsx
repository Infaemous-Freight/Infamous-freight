"use client";

import { useState } from "react";

type BidRow = {
  id: string;
  load_id: string;
  carrier_id: string;
  amount_cents: number;
  status: string;
  message: string | null;
  created_at: string;
};

export default function BidList({ bids, canAccept }: { bids: BidRow[]; canAccept: boolean }): React.ReactElement {
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

    if (!json.ok) {
      setErr(json.error || "Failed");
      return;
    }

    setOk("Bid accepted. Assignment created.");
    window.location.reload();
  }

  return (
    <div className="card marketplace-card">
      <div className="marketplace-card-title">Bids</div>
      {err && <p className="status-message error">{err}</p>}
      {ok && <p className="status-message success">{ok}</p>}
      <div className="marketplace-stack">
        {bids.map((b) => (
          <div key={b.id} className="marketplace-bid">
            <div className="marketplace-bid-info">
              <div className="marketplace-bid-amount">
                ${(b.amount_cents / 100).toFixed(2)} - {b.status}
              </div>
              {b.message && <div className="marketplace-muted">{b.message}</div>}
              <div className="marketplace-muted">carrier: {b.carrier_id}</div>
            </div>
            {canAccept && b.status === "pending" && (
              <button
                className="btn btn-primary"
                disabled={busy === b.id}
                onClick={() => acceptBid(b.id)}
                type="button"
              >
                {busy === b.id ? "Accepting..." : "Accept"}
              </button>
            )}
          </div>
        ))}
        {bids.length === 0 && <div className="marketplace-muted">No bids yet.</div>}
      </div>
    </div>
  );
}
