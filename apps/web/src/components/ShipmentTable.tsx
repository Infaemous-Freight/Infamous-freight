import type { Shipment } from "@infamous-freight/shared";

const STATUS_COLORS: Record<string, string> = {
  CREATED: "#6b7280",
  POSTED: "#2563eb",
  ASSIGNED: "#7c3aed",
  PICKED_UP: "#d97706",
  IN_TRANSIT: "#0891b2",
  DELIVERED: "#16a34a",
  CANCELLED: "#dc2626",
};

export function ShipmentTable({ shipments }: { shipments: Shipment[] }) {
  if (shipments.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          border: "1px dashed #d1d5db",
          borderRadius: 8,
          color: "#6b7280",
        }}
      >
        No shipments found.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        data-testid="shipments-table"
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
            <th style={{ padding: "8px 12px" }}>Tracking ID</th>
            <th style={{ padding: "8px 12px" }}>Origin</th>
            <th style={{ padding: "8px 12px" }}>Destination</th>
            <th style={{ padding: "8px 12px" }}>Reference</th>
            <th style={{ padding: "8px 12px" }}>Status</th>
            <th style={{ padding: "8px 12px" }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => (
            <tr
              key={s.id}
              style={{
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
                {s.trackingId.slice(0, 8)}…
              </td>
              <td style={{ padding: "10px 12px" }}>{s.origin}</td>
              <td style={{ padding: "10px 12px" }}>{s.destination}</td>
              <td style={{ padding: "10px 12px", color: "#6b7280" }}>{s.reference ?? "—"}</td>
              <td style={{ padding: "10px 12px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: STATUS_COLORS[s.status] ?? "#6b7280",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {s.status}
                </span>
              </td>
              <td style={{ padding: "10px 12px", color: "#6b7280" }}>
                {new Date(s.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
