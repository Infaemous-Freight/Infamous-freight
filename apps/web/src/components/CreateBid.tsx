"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function CreateBid({ loadId }: { loadId: string }): React.ReactElement {
  const [amount, setAmount] = useState("0");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    const supabase = supabaseBrowser();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setErr("Not signed in");
      return;
    }

    const parsedAmount = Number.parseFloat((amount || "").trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setErr("Please enter a valid non-negative amount in USD.");
      return;
    }
    const amountCents = Math.round(parsedAmount * 100);

    // @ts-expect-error - Supabase type definitions incompatibility
    const { error } = await supabase.from("bids").insert({
      load_id: loadId,
      carrier_id: u.user.id,
      amount_cents: amountCents,
      message: message || null,
    });

    if (error) {
      setErr(error.message);
      return;
    }

    setOk("Bid submitted.");
  }

  return (
    <div className="card marketplace-card">
      <div className="marketplace-card-title">Place a Bid</div>
      <form onSubmit={onSubmit} className="form-grid marketplace-form">
        <div className="form-control">
          <label htmlFor="bid-amount">Amount USD</label>
          <input
            id="bid-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount USD"
          />
        </div>
        <div className="form-control">
          <label htmlFor="bid-message">Message (optional)</label>
          <input
            id="bid-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message (optional)"
          />
        </div>
        {err && <p className="status-message error">{err}</p>}
        {ok && <p className="status-message success">{ok}</p>}
        <button className="btn btn-primary" type="submit">
          Submit Bid
        </button>
      </form>
    </div>
  );
}
