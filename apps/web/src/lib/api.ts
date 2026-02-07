interface ApiOptions {
  token?: string;
  method?: string;
  body?: unknown;
}

async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const { token, method = "GET", body } = options;
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body) headers["content-type"] = "application/json";

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const error = payload?.error ?? `Request failed (${res.status})`;
    throw new Error(error);
  }
  return payload as T;
}

export function getMe(token: string) {
  return apiFetch<{ userId: string; companies: any[]; activeCompanyId: string | null }>("/api/me", {
    token,
  });
}

export function setActiveCompany(token: string, companyId: string) {
  return apiFetch("/api/active-company", {
    token,
    method: "POST",
    body: { companyId },
  });
}

export function bootstrapCompany(companyName: string, ownerUserId: string) {
  return apiFetch<{ companyId: string }>("/api/enterprise/bootstrap", {
    method: "POST",
    body: { companyName, ownerUserId },
  });
}

export function createStripeCustomer(token: string) {
  return apiFetch("/api/billing/create-customer", { token, method: "POST" });
}

export function createCheckoutSession(token: string, plan: "operator" | "fleet", seats: number) {
  return apiFetch<{ url: string }>("/api/billing/checkout", {
    token,
    method: "POST",
    body: { plan, seats },
  });
}

export function createBillingPortal(token: string) {
  return apiFetch<{ url: string }>("/api/billing/portal", {
    token,
    method: "POST",
  });
}

export function listLoads(token: string) {
  return apiFetch<{ loads: any[] }>("/api/loads", { token });
}

export function createLoad(token: string, payload: Record<string, unknown>) {
  return apiFetch<{ load: any }>("/api/loads", {
    token,
    method: "POST",
    body: payload,
  });
}

export function listThreads(token: string, loadId?: string) {
  const query = loadId ? `?loadId=${loadId}` : "";
  return apiFetch<{ threads: any[] }>(`/api/threads${query}`, { token });
}

export function createThread(token: string, loadId?: string) {
  return apiFetch<{ thread: any }>("/api/threads", {
    token,
    method: "POST",
    body: { loadId },
  });
}

export function listMessages(token: string, threadId: string) {
  return apiFetch<{ messages: any[] }>(`/api/messages?threadId=${threadId}`, { token });
}

export function createMessage(token: string, threadId: string, body: string) {
  return apiFetch<{ message: any }>("/api/messages", {
    token,
    method: "POST",
    body: { threadId, body },
  });
}

export function listStatusEvents(token: string, loadId: string) {
  return apiFetch<{ events: any[] }>(`/api/status?loadId=${loadId}`, { token });
}

export function createStatusEvent(token: string, loadId: string, status: string, note?: string) {
  return apiFetch<{ event: any }>("/api/status", {
    token,
    method: "POST",
    body: { loadId, status, note },
  });
}

export function listDocuments(token: string, loadId?: string) {
  const query = loadId ? `?loadId=${loadId}` : "";
  return apiFetch<{ documents: any[] }>(`/api/documents${query}`, { token });
}

export function createDocumentUpload(
  token: string,
  payload: { loadId?: string; docType?: string; fileName: string },
) {
  return apiFetch<{ document: any; upload: { path: string; signedUrl: string; token: string } }>(
    "/api/documents",
    {
      token,
      method: "POST",
      body: payload,
    },
  );
}

export function fireAiAction(token: string, actions: number) {
  return apiFetch("/api/ai/action", {
    token,
    method: "POST",
    body: { actions },
  });
}

export function unlockAiCap(token: string) {
  return apiFetch("/api/admin/ai/unlock", { token, method: "POST" });
}
