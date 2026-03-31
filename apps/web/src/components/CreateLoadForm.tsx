"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function CreateLoadForm(): React.ReactElement {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [originState, setOriginState] = useState("");
  const [destCity, setDestCity] = useState("");
  const [destState, setDestState] = useState("");
  const [rate, setRate] = useState("0");
  const [status, setStatus] = useState<"open" | "draft">("open");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const supabase = supabaseBrowser();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setErr("Not signed in");
      return;
    }

    const parsedRate = Number.parseFloat(rate);
    if (!Number.isFinite(parsedRate) || Number.isNaN(parsedRate) || parsedRate < 0) {
      setErr("Rate must be a non-negative number");
      return;
    }

    const rateCents = Math.round(parsedRate * 100);
    const { data, error } = await supabase
      .from("loads")
      // @ts-ignore - Supabase type definitions incompatibility with .insert()
      .insert({
        shipper_id: u.user.id,
        title: title || null,
        origin_city: originCity || null,
        origin_state: originState || null,
        destination_city: destCity || null,
        destination_state: destState || null,
        rate_cents: rateCents,
        status,
      })
      .select("id")
      .single();

    if (error) {
      setErr(error.message);
      return;
    }

    if (!data) {
      setErr("Load creation failed");
      return;
    }

    // @ts-ignore - Supabase type inference issue
    router.push(`/loads/${data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="form-grid marketplace-form">
      <div className="form-control">
        <label htmlFor="load-title">Title</label>
        <input
          id="load-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
      </div>
      <div className="marketplace-form-row">
        <div className="form-control">
          <label htmlFor="origin-city">Origin city</label>
          <input
            id="origin-city"
            value={originCity}
            onChange={(e) => setOriginCity(e.target.value)}
            placeholder="Origin city"
          />
        </div>
        <div className="form-control">
          <label htmlFor="origin-state">Origin state</label>
          <input
            id="origin-state"
            value={originState}
            onChange={(e) => setOriginState(e.target.value)}
            placeholder="Origin state"
          />
        </div>
      </div>
      <div className="marketplace-form-row">
        <div className="form-control">
          <label htmlFor="dest-city">Destination city</label>
          <input
            id="dest-city"
            value={destCity}
            onChange={(e) => setDestCity(e.target.value)}
            placeholder="Destination city"
          />
        </div>
        <div className="form-control">
          <label htmlFor="dest-state">Destination state</label>
          <input
            id="dest-state"
            value={destState}
            onChange={(e) => setDestState(e.target.value)}
            placeholder="Destination state"
          />
        </div>
      </div>
      <div className="marketplace-form-row">
        <div className="form-control">
          <label htmlFor="rate">Rate USD</label>
          <input
            id="rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="Rate USD"
          />
        </div>
        <div className="form-control">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "open" | "draft")}
          >
            <option value="open">Open (marketplace)</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>
      {err && <p className="status-message error">{err}</p>}
      <button className="btn btn-primary" type="submit">
        Create Load
      </button>
    </form>
  );
}
