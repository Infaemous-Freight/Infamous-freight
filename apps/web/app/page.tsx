async function getLoads() {
  const baseUrl = process.env.API_URL ?? "http://localhost:4000";

  const res = await fetch(`${baseUrl}/loads`, {
    headers: {
      Authorization: `Bearer ${process.env.DEMO_JWT ?? ""}`
    },
    cache: "no-store"
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export default async function Page() {
  const loads = await getLoads();

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Infamous Freight Admin</h1>
      <p>Loads dashboard</p>

      <div style={{ display: "grid", gap: 12 }}>
        {loads.map((load: any) => (
          <div
            key={load.id}
            style={{
              border: "1px solid #ddd",
              padding: 16,
              borderRadius: 12
            }}
          >
            <strong>{load.referenceNumber}</strong>
            <div>Status: {load.status}</div>
            <div>Weight: {load.weightLbs} lbs</div>
            <div>Trailer: {load.trailerType}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
