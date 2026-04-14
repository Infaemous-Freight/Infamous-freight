import type { Shipment } from "@infamous-freight/shared";
import { apiGet } from "../../lib/api";
import { getDemoAuth } from "../../lib/auth";
import { ShipmentTable } from "../../components/ShipmentTable";

export const metadata = { title: "Shipments" };

export default async function ShipmentsPage() {
  const { token } = getDemoAuth();
  let shipments: Shipment[] = [];
  let error: string | null = null;

  try {
    const res = await apiGet<{ ok: boolean; data: Shipment[] }>("/shipments", token);
    shipments = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load shipments";
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Shipments</h2>
      </div>
      {error ? (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      ) : (
        <ShipmentTable shipments={shipments} />
      )}
    </main>
  );
}
