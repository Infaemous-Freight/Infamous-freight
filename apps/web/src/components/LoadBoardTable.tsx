import type { Load } from "@infamous-freight/shared";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#16a34a",
  CLAIMED: "#d97706",
  ASSIGNED: "#2563eb",
  CLOSED: "#6b7280",
};

export function LoadBoardTable({ loads }: { loads: Load[] }) {
  if (loads.length === 0) {
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
        No loads available.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        data-testid="loadboard-table"
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
            <th style={{ padding: "8px 12px" }}>Lane</th>
            <th style={{ padding: "8px 12px" }}>Origin → Dest</th>
            <th style={{ padding: "8px 12px" }}>Distance</th>
            <th style={{ padding: "8px 12px" }}>Weight</th>
            <th style={{ padding: "8px 12px" }}>Rate</th>
            <th style={{ padding: "8px 12px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {loads.map((l) => (
            <tr key={l.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "10px 12px", fontWeight: 600 }}>{l.lane}</td>
              <td style={{ padding: "10px 12px" }}>
                {l.originCity}, {l.originState} → {l.destCity}, {l.destState}
              </td>
              <td style={{ padding: "10px 12px" }}>{l.distanceMi} mi</td>
              <td style={{ padding: "10px 12px" }}>{l.weightLb.toLocaleString()} lb</td>
              <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                ${(l.rateCents / 100).toFixed(2)}
              </td>
              <td style={{ padding: "10px 12px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: STATUS_COLORS[l.status] ?? "#6b7280",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {l.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
