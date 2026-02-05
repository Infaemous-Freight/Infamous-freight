import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { getToken } from "../../lib/session";

export default function ConnectReturn() {
  const [msg, setMsg] = useState("Finalizing…");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setMsg("Missing token. Return to dashboard and try again.");
      return;
    }
    api("/connect/status", {}, token)
      .then((s) =>
        setMsg(
          s.onboarded
            ? "✅ Connect complete. Payouts enabled."
            : "⚠️ Connect not complete yet. Finish the steps in Stripe.",
        ),
      )
      .catch(() => setMsg("Could not verify Connect status. Try again."));
  }, []);

  return (
    <div className="page">
      <section className="section">
        <div className="container" style={{ maxWidth: 620 }}>
          <div className="card">
            <h1 className="section-title" style={{ marginTop: 0 }}>
              Stripe Connect
            </h1>
            <p style={{ color: "var(--muted-400)" }}>{msg}</p>
            <Link href="/connect" className="btn btn-primary">
              Back to Connect
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
