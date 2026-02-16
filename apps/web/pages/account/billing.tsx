import React, { useEffect, useState } from "react";
import Link from "next/link";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Billing() {
  type Entitlements = {
    plan?: string;
    features?: string | string[];
    [key: string]: unknown;
  };

  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setErr(null);
    const token = localStorage.getItem("genesisToken") || "dev-token";
    const res = await fetch(`${apiBase}/v1/billing/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-user-id": "demo-user",
      },
    });
    const data = (await res.json()) as { entitlements?: Entitlements; error?: string };
    if (!res.ok) throw new Error(data?.error ?? "Failed to load billing");
    setEnt(data.entitlements ?? null);
  }

  useEffect(() => {
    load().catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, []);

  async function portal() {
    setBusy(true);
    setErr(null);
    try {
      const customerId = prompt("Enter Stripe customerId (enable DB lookup in Phase-15):") || "";
      const token = localStorage.getItem("genesisToken") || "dev-token";
      const res = await fetch(`${apiBase}/v1/billing/portal`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-id": "demo-user",
        },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Portal failed");
      window.location.href = data.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Portal failed");
    } finally {
      setBusy(false);
    }
  }

  const card: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(255,0,0,0.25)",
    background: "rgba(255,0,0,0.02)",
    padding: 16,
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ margin: 0, color: "rgb(180,0,0)" }}>Billing & Account</h1>
      <p style={{ opacity: 0.85 }}>
        View your subscription and manage your Infamous Freight account.
      </p>

      {err ? (
        <div
          style={{
            ...card,
            border: "1px solid rgba(255,0,0,0.45)",
            background: "rgba(255,0,0,0.06)",
            marginTop: 14,
          }}
        >
          <strong style={{ color: "rgb(180,0,0)" }}>Error:</strong> {err}
        </div>
      ) : null}

      {ent ? (
        <section style={{ ...card, marginTop: 14 }}>
          <h2 style={{ marginTop: 0 }}>Current Entitlements</h2>
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <strong>Plan:</strong> {ent.plan}
            </div>
            <div>
              <strong>Features:</strong> {ent.features}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              <pre
                style={{
                  background: "rgba(0,0,0,0.05)",
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                {JSON.stringify(ent, null, 2)}
              </pre>
            </div>
          </div>

          <button
            onClick={portal}
            disabled={busy}
            style={{
              marginTop: 12,
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,0,0,0.45)",
              background: "rgba(255,0,0,0.10)",
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Loading..." : "Open Stripe Portal"}
          </button>
        </section>
      ) : (
        <div style={{ marginTop: 14, opacity: 0.75 }}>Loading...</div>
      )}

      <div style={{ marginTop: 14, opacity: 0.8, fontSize: 12 }}>
        <Link href="/pricing">View Plans</Link> • Phase-14 Stripe Billing
      </div>
    </main>
  );
}
