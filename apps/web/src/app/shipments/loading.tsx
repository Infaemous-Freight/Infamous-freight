export default function Loading() {
  return (
    <main style={{ padding: 24 }}>
      <h2>Shipments</h2>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            aria-hidden="true"
            style={{
              padding: 12,
              border: "1px solid #333",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              height: 40,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </main>
  );
}
