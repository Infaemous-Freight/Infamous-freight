import { EventSourcePolyfill } from "event-source-polyfill";

/**
 * Connects to the API SSE stream and forwards events to the caller.
 * Uses Authorization header when a token is present.
 */
export function connectSSE(onEvent: (type: string, data: unknown) => void) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const url = `${baseUrl}/realtime/stream`;

  const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;

  if (!token) {
    throw new Error("Cannot connect SSE without access token");
  }

  const es = new EventSourcePolyfill(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  es.addEventListener("load.updated", (e: MessageEvent) => onEvent("load.updated", JSON.parse(e.data)));
  es.addEventListener("assignment.created", (e: MessageEvent) =>
    onEvent("assignment.created", JSON.parse(e.data))
  );
  es.addEventListener("assignment.updated", (e: MessageEvent) =>
    onEvent("assignment.updated", JSON.parse(e.data))
  );
  es.addEventListener("shipment.updated", (e: MessageEvent) => onEvent("shipment.updated", JSON.parse(e.data)));
  es.addEventListener("heartbeat", () => void 0);

  return () => es.close();
}
