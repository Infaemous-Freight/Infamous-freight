import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { prisma } from '../lib/prisma.js';

export const realtimeRoutes = Router();
realtimeRoutes.use(requireAuth, requireTenant);

// Server-Sent Events stream for a shipment: emits last ping + last events every few seconds.
// Works in browsers without websocket infra.
realtimeRoutes.get('/shipments/:id/stream', async (req, res) => {
  const orgId = req.orgId!;
  const shipmentId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let lastPingId: string | null = null;
  let lastEventId: string | null = null;

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send('hello', { shipmentId });

  const timer = setInterval(async () => {
    try {
      const [ping, events] = await Promise.all([
        prisma.locationPing.findFirst({
          where: { orgId, shipmentId },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.shipmentEvent.findMany({
          where: { orgId, shipmentId },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      if (ping && ping.id !== lastPingId) {
        lastPingId = ping.id;
        send('ping', ping);
      }

      const newestEvent = events[0];
      if (newestEvent && newestEvent.id !== lastEventId) {
        lastEventId = newestEvent.id;
        send('events', events);
      }
    } catch (e) {
      send('error', { message: 'stream_poll_failed' });
    }
  }, 3000);

  req.on('close', () => {
    clearInterval(timer);
    res.end();
  });
});
