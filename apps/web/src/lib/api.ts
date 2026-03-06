const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}

export async function apiPost<T>(path: string, token: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}
