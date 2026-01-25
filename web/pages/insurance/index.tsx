/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Page: Insurance Center Dashboard
 */

export default function InsuranceDashboard() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <header style={{ marginBottom: 24 }}>
        <h1>Insurance Center</h1>
        <p>Compliance oversight, certificate tracking, and coverage requirements.</p>
      </header>

      <section style={{ marginBottom: 24 }}>
        <h2>Compliance Summary</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {[
            { label: "Compliant", value: 12 },
            { label: "Warning", value: 3 },
            { label: "Non-compliant", value: 1 },
            { label: "Suspended", value: 0 },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 16,
                background: "#fff",
              }}
            >
              <div style={{ fontSize: 12, textTransform: "uppercase", color: "#64748b" }}>
                {card.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 600 }}>{card.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Expiring Soon</h2>
        <ul>
          <li>Carrier Pacific Haul - CARGO expires in 7 days</li>
          <li>Metro Logistics - GENERAL_LIABILITY expires in 14 days</li>
          <li>Night Shift Freight - CYBER expires in 30 days</li>
        </ul>
      </section>

      <section>
        <h2>Quick Actions</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/insurance/requirements" style={{ padding: 12, border: "1px solid #0f172a", borderRadius: 8 }}>
            Set Requirements
          </a>
          <a href="/insurance/carriers/sample" style={{ padding: 12, border: "1px solid #0f172a", borderRadius: 8 }}>
            Review Certificates
          </a>
        </div>
      </section>
    </main>
  );
}
