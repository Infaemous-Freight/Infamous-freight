import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { getToken } from "../../lib/session";

type ConnectStatus = {
  onboarded?: boolean;
  details_submitted?: boolean;
  payouts_enabled?: boolean;
};

export default function ConnectPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => setToken(getToken()), []);
  useEffect(() => {
    if (!token) return;
    api("/connect/status", {}, token)
      .then(setStatus)
      .catch(() => {});
  }, [token]);

  async function start() {
    setErr("");
    try {
      const res = await api("/connect/create", { method: "POST", body: JSON.stringify({}) }, token);
      window.location.href = res.url;
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function refreshStatus() {
    setErr("");
    try {
      const res = await api("/connect/status", {}, token);
      setStatus(res);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="page">
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <Link href="/" className="btn btn-tertiary">
            ← Back
          </Link>
          <h1 className="section-title" style={{ marginTop: 16 }}>
            Stripe Connect
          </h1>

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

          <div className="card" style={{ marginTop: 16 }}>
            <p style={{ color: "var(--muted-400)" }}>
              Connect enables real payouts to owner-operators.
            </p>

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <button onClick={start} className="btn btn-primary">
                Start Connect Onboarding
              </button>
              <button onClick={refreshStatus} className="btn btn-secondary">
                Refresh Status
              </button>
            </div>

            <div style={{ marginTop: 16, color: "var(--muted-400)" }}>
              <div>
                <strong>Onboarded:</strong> {String(status?.onboarded ?? false)}
              </div>
              <div>
                <strong>Details Submitted:</strong> {String(status?.details_submitted ?? false)}
              </div>
              <div>
                <strong>Payouts Enabled:</strong> {String(status?.payouts_enabled ?? false)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
