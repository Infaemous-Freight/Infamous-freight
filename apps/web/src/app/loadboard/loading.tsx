export default function Loading() {
  return (
    <main style={{ padding: 24 }}>
      <h2>Load Board</h2>
      <p style={{ opacity: 0.85 }}>Easy access + claim workflow.</p>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            aria-hidden="true"
            style={{
              padding: 14,
              border: "1px solid #333",
              borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              height: 96,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </main>
  );
}
