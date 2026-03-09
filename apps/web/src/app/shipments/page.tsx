import type { Shipment } from "@infamous-freight/shared";
import { apiGet } from "../../lib/api";
import { getDemoAuth } from "../../lib/auth";

export default async function ShipmentsPage() {
  const { token } = getDemoAuth();
  const res = await apiGet<{ data: Shipment[] }>("/shipments", token);

  return (
    <main style={{ padding: 24 }}>
      <h2>Shipments</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {res.data.map((s) => (
          <div key={s.id} style={{ padding: 12, border: "1px solid #333", borderRadius: 12 }}>
            {s.ref} — {s.originCity}, {s.originState} → {s.destCity}, {s.destState} ({s.status})
          </div>
        ))}
      </div>
    </main>
  );
}
