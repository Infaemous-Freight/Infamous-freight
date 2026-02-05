import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { getToken } from "../../lib/session";
import { isGetTrucknEnabled } from "../../lib/feature-flags";

type Load = {
  id: string;
  reference: string;
  pickupCity: string;
  dropoffCity: string;
  miles: number;
  payoutCents: number;
};

export default function LoadsPage() {
  const [token, setToken] = useState("");
  const [loads, setLoads] = useState<Load[]>([]);
  const [err, setErr] = useState("");
  const getTrucknEnabled = isGetTrucknEnabled();

  useEffect(() => setToken(getToken()), []);
  useEffect(() => {
    if (!token || !getTrucknEnabled) return;
    api("/loads", {}, token)
      .then((r) => setLoads(r.loads))
      .catch((e) => setErr(e.message));
  }, [token, getTrucknEnabled]);

  async function accept(load: Load) {
    setErr("");
    try {
      const res = await api(`/loads/${load.id}/accept`, { method: "POST" }, token);
      localStorage.setItem(
        "active_assignment",
        JSON.stringify({
          assignmentId: res.assignment.id,
          loadId: load.id,
          reference: load.reference,
          pickupCity: load.pickupCity,
          dropoffCity: load.dropoffCity,
          miles: load.miles,
          payoutCents: load.payoutCents,
        }),
      );
      window.location.href = "/loads/active";
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="page">
      <section className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Link href="/" className="btn btn-tertiary">
              ← Back
            </Link>
            <Link href="/loads/active" className="btn btn-secondary">
              Active Load
            </Link>
          </div>
          <h1 className="section-title" style={{ marginTop: 16 }}>
            Available Loads
          </h1>

          {!getTrucknEnabled ? (
            <div className="card">Get Truck’N marketplace is currently disabled.</div>
          ) : null}
          {err ? (
            <div
              className="card"
              style={{
                borderColor: "rgba(239, 68, 68, 0.4)",
                background: "rgba(239, 68, 68, 0.08)",
                color: "#fca5a5",
              }}
            >
              {err}
            </div>
          ) : null}

          {getTrucknEnabled ? (
            <div className="grid" style={{ marginTop: 16 }}>
              {loads.map((l) => (
                <div key={l.id} className="card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong>{l.reference}</strong>
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>Æ</span>
                  </div>
                  <p style={{ marginTop: 8, color: "var(--muted-400)" }}>
                    {l.pickupCity} → {l.dropoffCity}
                  </p>
                  <p style={{ marginTop: 4, color: "var(--muted-400)" }}>
                    {l.miles} mi • ${(l.payoutCents / 100).toFixed(2)}
                  </p>
                  <button
                    onClick={() => accept(l)}
                    className="btn btn-primary"
                    style={{ marginTop: 12, width: "100%" }}
                  >
                    Accept (Get Truck’N)
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
