import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { authenticate } from "../middleware/security.js";

export const realtimeRoutes: Router = Router();
realtimeRoutes.use(authenticate);

/**
 * Streams shipment updates via SSE for authenticated users in the same org.
 * Includes heartbeat pings to keep intermediary proxies from closing the stream.
 */
realtimeRoutes.get("/shipments/:id/stream", async (req, res) => {
  const orgId = req.orgId;
  const shipmentId = req.params.id;

  if (!orgId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, orgId },
    select: { id: true },
  });

  if (!shipment) {
    return res.status(404).json({ error: "Shipment not found" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let lastPingId: string | null = null;
  let lastEventId: string | null = null;

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send("hello", { shipmentId });

  const pollTimer = setInterval(async () => {
    try {
      const [ping, events] = await Promise.all([
        prisma.locationPing.findFirst({
          where: { orgId, shipmentId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.shipmentEvent.findMany({
          where: { orgId, shipmentId },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

      if (ping && ping.id !== lastPingId) {
        lastPingId = ping.id;
        send("ping", ping);
      }

      const newestEvent = events[0];
      if (newestEvent && newestEvent.id !== lastEventId) {
        lastEventId = newestEvent.id;
        send("events", events);
      }
    } catch (_e) {
      send("error", { message: "stream_poll_failed" });
    }
  }, 3000);

  const heartbeatTimer = setInterval(() => {
    send("heartbeat", { at: new Date().toISOString() });
  }, 25000);

  req.on("close", () => {
    clearInterval(pollTimer);
    clearInterval(heartbeatTimer);
    res.end();
  });

  return undefined;
});
