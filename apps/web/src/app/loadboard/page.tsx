import type { Load } from "@infamous-freight/shared";
import { apiGet, apiPost } from "../../lib/api";
import { getDemoAuth } from "../../lib/auth";

export default async function LoadBoard() {
  const { token, tenantId } = getDemoAuth();
  const res = await apiGet<{ data: Load[] }>("/loadboard", token);

  return (
    <main style={{ padding: 24 }}>
      <h2>Load Board</h2>
      <p style={{ opacity: 0.85 }}>Easy access + claim workflow.</p>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {res.data.map((l) => (
          <form
            key={l.id}
            action={async () => {
              "use server";
              await apiPost(`/loadboard/${l.id}/claim`, token, { tenantId });
            }}
            style={{ padding: 14, border: "1px solid #333", borderRadius: 16 }}
          >
            <div style={{ fontWeight: 700 }}>{l.lane}</div>
            <div style={{ opacity: 0.85 }}>
              {l.weightLb} lb • {l.distanceMi} mi • ${(l.rateCents / 100).toFixed(2)} • {l.status}
            </div>
            <button style={{ marginTop: 10, padding: 8 }} disabled={l.status !== "OPEN"}>
              Claim Load
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
