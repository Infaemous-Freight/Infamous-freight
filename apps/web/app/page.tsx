async function getSession() {
  const baseUrl = process.env.API_URL ?? "http://localhost:4000";

  const login = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.DEMO_EMAIL ?? "dispatch@infamousfreight.com" }),
    cache: "no-store"
  });

  if (!login.ok) {
    return null;
  }

  return login.json() as Promise<{ accessToken: string }>;
}

async function getLoads(token: string) {
  const baseUrl = process.env.API_URL ?? "http://localhost:4000";

  const res = await fetch(`${baseUrl}/loads`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function Page() {
  const session = await getSession();
  const loads = session ? await getLoads(session.accessToken) : [];

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Infamous Freight Admin</h1>
      <p>Live loads dashboard</p>

      <div style={{ display: "grid", gap: 12 }}>
        {loads.map((load: any) => (
          <div
            key={load.id}
            style={{ border: "1px solid #ddd", padding: 16, borderRadius: 12 }}
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
