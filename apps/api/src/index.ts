import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { env } from './env.js';
import { httpLogger } from './lib/logger.js';
import { generalLimiter, authLimiter, trackingLimiter } from './middleware/rateLimit.js';

import { authRoutes } from './routes/auth.routes.js';
import { loadsRoutes } from './routes/loads.routes.js';
import { shipmentsRoutes } from './routes/shipments.routes.js';
import { trackingRoutes } from './routes/tracking.routes.js';
import { billingRoutes } from './routes/billing.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { documentsRoutes } from './routes/documents.routes.js';
import { realtimeRoutes } from './routes/realtime.routes.js';
import { stripeRoutes } from './routes/stripe.routes.js';

import prisma from './lib/prisma.js';

const app = express();

// Raw body capture for Stripe webhook signature verification
app.use((req, _res, next) => {
  const chunks: Buffer[] = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    (req as any).rawBody = Buffer.concat(chunks);
    next();
  });
});

app.use(express.json({ limit: '2mb' }));
app.use(cors());
app.use(helmet());
app.use(httpLogger);
app.use(generalLimiter);

// serve uploaded docs in dev
app.use('/uploads', express.static('apps/api/uploads'));

app.get('/health', (_req, res) => res.json({ ok: true }));

// demo helper: lookup orgId by email
app.get('/org/lookup', async (req, res) => {
  const email = String(req.query.email ?? '').toLowerCase();
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const user = await prisma.user.findFirst({ where: { email }, include: { org: true } });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ orgId: user.orgId, orgName: user.org.name });
});

// auth endpoints get stricter limit
app.use('/auth', authLimiter, authRoutes);

// core
app.use('/loads', loadsRoutes);
app.use('/shipments', shipmentsRoutes);

// tracking gets higher allowance
app.use('/tracking', trackingLimiter, trackingRoutes);

// billing + ai
app.use('/billing', billingRoutes);
app.use('/ai', aiRoutes);

// docs + realtime + stripe
app.use('/documents', documentsRoutes);
app.use('/realtime', realtimeRoutes);
app.use('/stripe', stripeRoutes);

app.listen(env.PORT, () => {
  console.log(`[api] http://localhost:${env.PORT}`);
});
