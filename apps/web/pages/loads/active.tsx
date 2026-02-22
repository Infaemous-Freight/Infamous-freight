import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, putToPresignedUrl } from "../../lib/api";
import { getToken } from "../../lib/session";
import { isGetTrucknEnabled } from "../../lib/feature-flags";

type Active = {
  assignmentId: string;
  loadId: string;
  reference: string;
  pickupCity: string;
  dropoffCity: string;
  miles: number;
  payoutCents: number;
};

export default function ActiveLoadPage(): React.ReactElement {
  const [token, setToken] = useState("");
  const [active, setActive] = useState<Active | null>(null);
  const [podFile, setPodFile] = useState<File | null>(null);
  const [podAttached, setPodAttached] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const getTrucknEnabled = isGetTrucknEnabled();

  useEffect(() => setToken(getToken()), []);
  useEffect(() => {
    const raw = localStorage.getItem("active_assignment");
    setActive(raw ? JSON.parse(raw) : null);
  }, []);

  const payoutDollars = useMemo(
    () => (active ? (active.payoutCents / 100).toFixed(2) : "0.00"),
    [active],
  );

  async function uploadAndAttachPOD() {
    if (!active) return;
    if (!podFile) {
      setErr("Select a POD file first.");
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");

    try {
      const presign = await api(
        "/uploads/presign",
        {
          method: "POST",
          body: JSON.stringify({
            kind: "POD",
            contentType: podFile.type || "application/octet-stream",
            assignmentId: active.assignmentId,
          }),
        },
        token,
      );

      await putToPresignedUrl(presign.uploadUrl, podFile);

      await api(
        `/assignments/${active.assignmentId}/pod`,
        { method: "POST", body: JSON.stringify({ uploadId: presign.uploadId }) },
        token,
      );

      setPodAttached(true);
      setMsg("✅ POD uploaded and attached.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to upload POD");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!active) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await api(`/loads/${active.loadId}/complete`, { method: "POST" }, token);
      setMsg(
        `✅ Delivered. Payout created: $${(res.payout.amountCents / 100).toFixed(
          2,
        )} (status: ${res.payout.status})`,
      );
      localStorage.removeItem("active_assignment");
      setActive(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to complete load");
    } finally {
      setBusy(false);
    }
  }

  function clearActive() {
    localStorage.removeItem("active_assignment");
    setActive(null);
  }

  return (
    <div className="page">
      <section className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <Link href="/loads" className="btn btn-tertiary">
            ← Back to Loads
          </Link>
          <h1 className="section-title" style={{ marginTop: 16 }}>
            Active Load
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

          {!getTrucknEnabled ? (
            <div className="card" style={{ marginTop: 16 }}>
              Get Truck’N marketplace is currently disabled.
            </div>
          ) : !active ? (
            <div className="card" style={{ marginTop: 16 }}>
              <p style={{ color: "var(--muted-400)" }}>No active load.</p>
              <Link href="/loads" className="btn btn-primary">
                Pick a Load
              </Link>
            </div>
          ) : (
            <div className="card" style={{ marginTop: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong style={{ fontSize: "1.1rem" }}>{active.reference}</strong>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>Æ</span>
              </div>

              <p style={{ marginTop: 8, color: "var(--muted-400)" }}>
                {active.pickupCity} → {active.dropoffCity}
              </p>
              <p style={{ marginTop: 4, color: "var(--muted-400)" }}>
                {active.miles} mi • ${payoutDollars}
              </p>

              <div className="card" style={{ marginTop: 16, background: "rgba(255,255,255,0.02)" }}>
                <strong>Proof of Delivery (POD)</strong>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: "block", marginTop: 8 }}
                  onChange={(e) => setPodFile(e.target.files?.[0] || null)}
                />
                <button
                  onClick={uploadAndAttachPOD}
                  disabled={busy}
                  className="btn btn-secondary"
                  style={{ marginTop: 12, width: "100%" }}
                >
                  {busy ? "…" : podAttached ? "POD Attached ✅" : "Upload & Attach POD"}
                </button>
                <p style={{ marginTop: 8, color: "var(--muted-400)" }}>Completion requires POD.</p>
              </div>

              <button
                onClick={complete}
                disabled={busy}
                className="btn btn-primary"
                style={{ marginTop: 16, width: "100%" }}
              >
                {busy ? "…" : "Mark Delivered + Create Payout"}
              </button>

              <button
                onClick={clearActive}
                className="btn btn-secondary"
                style={{ marginTop: 12, width: "100%" }}
              >
                Clear Active Load
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
