import type { Request, Response } from "express";

/**
 * In-memory SSE client registry. Each connection is tagged to a tenant (tenantId).
 * This is intentionally lightweight; for multi-instance scaling, move to Redis/pubsub.
 */
type Client = {
  id: string;
  res: Response;
  tenantId: string;
  userId: string;
  heartbeat: NodeJS.Timeout;
};

const clients = new Map<string, Client>();

/**
 * Starts an SSE stream for an authenticated user.
 *
 * Security:
 * - Requires auth middleware upstream to populate req.auth.
 * - Streams are tenant-scoped; broadcasts only reach matching tenant clients.
 */
export function sseHandler(req: Request, res: Response) {
  const tenantId = String((req as any).auth?.tenantId ?? "");
  const userId = String((req as any).auth?.sub ?? "");

  if (!tenantId || !userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });

  res.write(`event: hello\ndata: ${JSON.stringify({ id })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`);
    } catch {
      // write failures are cleaned up in close handler
    }
  }, 25_000);

  clients.set(id, { id, res, tenantId, userId, heartbeat });

  req.on("close", () => {
    const c = clients.get(id);
    if (c) clearInterval(c.heartbeat);
    clients.delete(id);
  });
}

/**
 * Broadcast an SSE event to all connected clients in a tenant.
 */
export function sseBroadcast(tenantId: string, event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of clients.values()) {
    if (c.tenantId === tenantId) {
      c.res.write(payload);
    }
  }
}
