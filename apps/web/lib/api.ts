export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function api(
  path: string,
  opts: RequestInit = {},
  token?: string,
) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

export async function putToPresignedUrl(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}
