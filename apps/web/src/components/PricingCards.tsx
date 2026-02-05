export function PricingCards() {
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.5rem",
  } as const;
  const cardStyle = {
    padding: "1.5rem",
    borderRadius: "16px",
    border: "1px solid #e4e7f0",
    background: "#ffffff",
    boxShadow: "0 12px 32px rgba(17, 24, 39, 0.08)",
    display: "grid",
    gap: "0.5rem",
  } as const;

  return (
    <div style={gridStyle}>
      <div style={cardStyle}>
        <h3>Operator</h3>
        <p>$19 / seat</p>
        <p className="subtitle">Essentials for dispatch teams.</p>
      </div>
      <div style={cardStyle}>
        <h3>Fleet</h3>
        <p>$49 / seat</p>
        <p className="subtitle">AI automation and billing governance.</p>
      </div>
      <div style={cardStyle}>
        <h3>Enterprise</h3>
        <p>Invoice only</p>
        <p className="subtitle">Custom SLAs, onboarding, and support.</p>
      </div>
    </div>
  );
}
