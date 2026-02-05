import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { getBrowserLocation, getToken } from "../lib/session";
import { isGetTrucknEnabled } from "../lib/feature-flags";

export default function DriverDashboard() {
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const getTrucknEnabled = isGetTrucknEnabled();

  useEffect(() => setToken(getToken()), []);

  async function shareLocation() {
    setErr("");
    setMsg("");
    try {
      const loc = await getBrowserLocation();
      if (!loc) {
        throw new Error("Location unavailable (permission denied or unsupported).");
      }
      await api("/drivers/location", { method: "POST", body: JSON.stringify(loc) }, token);
      setMsg("✅ Location updated. Proximity matching ready.");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="page">
      <section className="section">
        <div className="container" style={{ maxWidth: 960 }}>
          <Link href="/" className="btn btn-tertiary">
            ← Back
          </Link>
          <h1 className="section-title" style={{ marginTop: 16 }}>
            Driver Dashboard
          </h1>
          <p className="section-subtitle">
            Infæmous Freight Enterprise driver controls for live loads, Connect, and location
            sharing.
          </p>

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
          {msg ? (
            <div
              className="card"
              style={{
                borderColor: "rgba(16, 185, 129, 0.4)",
                background: "rgba(16, 185, 129, 0.08)",
                color: "#a7f3d0",
                marginTop: 12,
              }}
            >
              {msg}
            </div>
          ) : null}

          <div className="grid grid-3" style={{ marginTop: 24 }}>
            <Link href="/connect" className="card">
              <h3>Stripe Connect</h3>
              <p>Start onboarding or check payout readiness.</p>
            </Link>
            {getTrucknEnabled ? (
              <>
                <Link href="/loads/active" className="card">
                  <h3>Active Load</h3>
                  <p>Upload POD and finalize delivery.</p>
                </Link>
                <Link href="/loads" className="card">
                  <h3>Available Loads</h3>
                  <p>Review and accept new assignments.</p>
                </Link>
              </>
            ) : null}
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h3>Driver Location</h3>
            <p style={{ color: "var(--muted-400)" }}>
              Share position for proximity matching and live dispatch routing.
            </p>
            <button
              onClick={shareLocation}
              className="btn btn-secondary"
              style={{ marginTop: 12 }}
              disabled={!token}
            >
              Share Location (for nearby loads)
            </button>
            {!token ? (
              <p style={{ marginTop: 8, color: "var(--muted-400)" }}>
                Add a driver token to localStorage key "token" to enable actions.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
