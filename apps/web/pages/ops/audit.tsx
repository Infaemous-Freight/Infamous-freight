import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type AuditEvent = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
};

export default function OpsAuditPage(): React.ReactElement {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (action.trim()) params.set("action", action.trim());
    if (entity.trim()) params.set("entity", entity.trim());
    params.set("limit", "200");
    return params.toString();
  }, [q, action, entity]);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${apiBase}/api/admin/audit-logs?${queryString}`;
      const headers: HeadersInit = {};

      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("authToken");
        const userId = window.localStorage.getItem("userId");

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        if (userId) {
          headers["x-user-id"] = userId;
        }
      }

      const res = await fetch(url, {
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Unable to load audit logs");
      }
      setEvents(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const interval = setInterval(() => {
      fetchAuditLogs();
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAuditLogs]);

  const card: React.CSSProperties = {
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "#fff",
    padding: 18,
    boxShadow: "0 16px 30px rgba(15,23,42,0.08)",
  };

  const input: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(15,23,42,0.15)",
    background: "rgba(248,250,252,0.95)",
  };

  const button: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(15,23,42,0.2)",
    background: "#111827",
    color: "#fff",
    cursor: loading ? "wait" : "pointer",
  };

  return (
    <>
      <Head>
        <title>Ops Audit Log | Infæmous Freight</title>
      </Head>

      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: 28,
          fontFamily: '"Space Grotesk", "Segoe UI", system-ui, sans-serif',
          minHeight: "100vh",
        }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0 }}>Audit Log</h1>
          <p style={{ margin: 0, color: "#475569" }}>
            Immutable trail of operational actions (latest 200 events).
          </p>
        </header>

        <section style={{ ...card, marginTop: 20 }}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              fetchAuditLogs();
            }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            <input
              style={input}
              name="q"
              placeholder="Search action/entity"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            <input
              style={input}
              name="action"
              placeholder="Action (e.g. JOB_ACCEPTED)"
              value={action}
              onChange={(event) => setAction(event.target.value)}
            />
            <input
              style={input}
              name="entity"
              placeholder="Entity (e.g. job)"
              value={entity}
              onChange={(event) => setEntity(event.target.value)}
            />
            <button
              type="submit"
              style={{
                ...button,
                opacity: loading ? 0.5 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Apply"}
            </button>
          </form>
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            {loading ? "Loading audit log results" : ""}
          </div>
          <label style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
            />
            <span style={{ color: "#475569", fontSize: 14 }}>Auto-refresh every 20s</span>
          </label>
        </section>

        {error && (
          <div
            style={{
              ...card,
              marginTop: 16,
              border: "1px solid rgba(220,38,38,0.35)",
              background: "rgba(248,113,113,0.08)",
              color: "#7f1d1d",
            }}
          >
            {error}
          </div>
        )}

        <section style={{ display: "grid", gap: 16, marginTop: 16 }}>
          {events.map((event) => (
            <article key={event.id} style={card}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {event.action} · <span style={{ color: "#64748b" }}>{event.entity}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {new Date(event.createdAt).toLocaleString()}
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
                actor: {event.actorUserId || "null"}
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: "#475569" }}>
                entity_id: {event.entityId || "null"}
              </div>

              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer" }}>Details</summary>
                <pre
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    background: "#f8fafc",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid rgba(15,23,42,0.08)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {event.metadata === null
                    ? "No metadata"
                    : JSON.stringify({ metadata: event.metadata }, null, 2)}
                </pre>
              </details>
            </article>
          ))}

          {events.length === 0 && !loading && !error && (
            <div style={{ color: "#64748b" }}>No audit events found.</div>
          )}
        </section>
      </main>
    </>
  );
}
