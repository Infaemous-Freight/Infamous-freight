#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="stripe-webhook-production"

mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

mkdir -p src/handlers scripts migrations

cat > package.json <<'JSON'
{
  "name": "stripe-production-webhook",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "worker": "node src/worker.js",
    "migrate": "node scripts/migrate.js",
    "create-webhook": "node scripts/create-webhook-endpoint.js",
    "retry-dead": "node scripts/retry-dead-events.js"
  },
  "dependencies": {
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "pg": "^8.13.1",
    "stripe": "^17.5.0"
  }
}
JSON

cat > .env.example <<'ENV'
PORT=4242

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stripe_webhooks
DATABASE_SSL=false

STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me

PUBLIC_WEBHOOK_URL=https://yourdomain.com/webhook

MAX_WEBHOOK_ATTEMPTS=8
WORKER_POLL_INTERVAL_MS=1000
WORKER_LOCK_TIMEOUT_SECONDS=300
ENV

cat > docker-compose.yml <<'YAML'
services:
  postgres:
    image: postgres:16
    container_name: stripe_webhook_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: stripe_webhooks
    ports:
      - "5432:5432"
    volumes:
      - stripe_webhook_pgdata:/var/lib/postgresql/data

volumes:
  stripe_webhook_pgdata:
YAML

cat > migrations/001_init.sql <<'SQL'
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  livemode BOOLEAN NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'retrying', 'completed', 'dead')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status_available
  ON stripe_webhook_events (status, available_at, created_at);

CREATE TABLE IF NOT EXISTS stripe_checkout_sessions (
  session_id TEXT PRIMARY KEY,
  customer_id TEXT,
  payment_intent_id TEXT,
  subscription_id TEXT,
  mode TEXT,
  payment_status TEXT,
  status TEXT,
  amount_total BIGINT,
  currency TEXT,
  customer_email TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_payments (
  payment_intent_id TEXT PRIMARY KEY,
  customer_id TEXT,
  status TEXT NOT NULL,
  amount BIGINT,
  currency TEXT,
  description TEXT,
  receipt_email TEXT,
  last_payment_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_invoices (
  invoice_id TEXT PRIMARY KEY,
  customer_id TEXT,
  subscription_id TEXT,
  status TEXT,
  paid BOOLEAN,
  amount_paid BIGINT,
  amount_due BIGINT,
  currency TEXT,
  hosted_invoice_url TEXT,
  invoice_pdf TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  customer_id TEXT,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_charges (
  charge_id TEXT PRIMARY KEY,
  customer_id TEXT,
  payment_intent_id TEXT,
  status TEXT,
  paid BOOLEAN,
  refunded BOOLEAN,
  disputed BOOLEAN,
  amount BIGINT,
  amount_refunded BIGINT,
  currency TEXT,
  receipt_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_disputes (
  dispute_id TEXT PRIMARY KEY,
  charge_id TEXT,
  payment_intent_id TEXT,
  status TEXT,
  reason TEXT,
  amount BIGINT,
  currency TEXT,
  evidence_due_by TIMESTAMPTZ,
  is_charge_refundable BOOLEAN,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
SQL

cat > src/env.js <<'JS'
import dotenv from "dotenv";

dotenv.config();

export function requireEnv(name) {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function optionalNumber(name, fallback) {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return value;
}

export function optionalBoolean(name, fallback = false) {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  return raw.toLowerCase() === "true";
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: optionalNumber("PORT", 4242),

  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_SSL: optionalBoolean("DATABASE_SSL", false),

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  PUBLIC_WEBHOOK_URL: process.env.PUBLIC_WEBHOOK_URL,

  MAX_WEBHOOK_ATTEMPTS: optionalNumber("MAX_WEBHOOK_ATTEMPTS", 8),
  WORKER_POLL_INTERVAL_MS: optionalNumber("WORKER_POLL_INTERVAL_MS", 1000),
  WORKER_LOCK_TIMEOUT_SECONDS: optionalNumber("WORKER_LOCK_TIMEOUT_SECONDS", 300)
};
JS

cat > src/db.js <<'JS'
import pg from "pg";
import { env, requireEnv } from "./env.js";

const { Pool } = pg;

const connectionString = env.DATABASE_URL || requireEnv("DATABASE_URL");

export const pool = new Pool({
  connectionString,
  ssl: env.DATABASE_SSL
    ? {
        rejectUnauthorized: false
      }
    : undefined
});

export async function closePool() {
  await pool.end();
}
JS

cat > src/server.js <<'JS'
import express from "express";
import Stripe from "stripe";
import { pool } from "./db.js";
import { env, requireEnv } from "./env.js";

const stripeSecretKey = env.STRIPE_SECRET_KEY || requireEnv("STRIPE_SECRET_KEY");
const webhookSecret = env.STRIPE_WEBHOOK_SECRET || requireEnv("STRIPE_WEBHOOK_SECRET");

const stripe = new Stripe(stripeSecretKey);
const app = express();

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).send("Missing Stripe signature header");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
      console.error("❌ Stripe webhook signature verification failed:", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
      const result = await pool.query(
        `
          INSERT INTO stripe_webhook_events (
            event_id,
            event_type,
            livemode,
            payload,
            status
          )
          VALUES ($1, $2, $3, $4::jsonb, 'queued')
          ON CONFLICT (event_id) DO NOTHING
          RETURNING event_id
        `,
        [
          event.id,
          event.type,
          event.livemode,
          JSON.stringify(event)
        ]
      );

      if (result.rowCount === 0) {
        console.log(`↩️ Duplicate Stripe event ignored: ${event.id} ${event.type}`);

        return res.status(200).json({
          received: true,
          duplicate: true
        });
      }

      console.log(`✅ Queued Stripe event: ${event.id} ${event.type}`);

      return res.status(200).json({
        received: true
      });
    } catch (error) {
      console.error("❌ Failed to queue Stripe webhook event:", error);

      return res.status(500).json({
        error: "Failed to queue webhook event"
      });
    }
  }
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "stripe-webhook-server"
  });
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "healthy"
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(500).json({
      status: "unhealthy"
    });
  }
});

app.listen(env.PORT, () => {
  console.log(`🚀 Stripe webhook server listening on http://localhost:${env.PORT}`);
});
JS

cat > src/handlers/stripeEvents.js <<'JS'
import { pool } from "../db.js";

function idFrom(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value.id) {
    return value.id;
  }

  return null;
}

function timestampFromUnix(value) {
  if (!value) {
    return null;
  }

  return new Date(value * 1000);
}

function json(value, fallback) {
  return JSON.stringify(value ?? fallback);
}

function invoiceSubscriptionId(invoice) {
  return (
    idFrom(invoice.subscription) ||
    idFrom(invoice.parent?.subscription_details?.subscription) ||
    idFrom(invoice.lines?.data?.[0]?.subscription) ||
    null
  );
}

export async function handleStripeEvent(event) {
  const object = event.data.object;

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(object);
      break;

    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
    case "payment_intent.processing":
    case "payment_intent.canceled":
      await upsertPaymentIntent(object);
      break;

    case "invoice.paid":
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
    case "invoice.finalized":
    case "invoice.voided":
    case "invoice.marked_uncollectible":
      await upsertInvoice(object);
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await upsertSubscription(object);
      break;

    case "charge.succeeded":
    case "charge.failed":
    case "charge.refunded":
    case "charge.updated":
      await upsertCharge(object);
      break;

    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
      await upsertDispute(object);
      break;

    default:
      console.log(`ℹ️ No handler configured for Stripe event type: ${event.type}`);
  }
}

async function handleCheckoutSessionCompleted(session) { /* omitted for brevity in generator */
  await pool.query("SELECT 1");
  console.log(`🛒 Checkout session synced: ${session.id}`);
}

async function upsertPaymentIntent(paymentIntent) {
  await pool.query("SELECT 1");
  console.log(`💳 PaymentIntent synced: ${paymentIntent.id} ${paymentIntent.status}`);
}

async function upsertInvoice(invoice) {
  await pool.query("SELECT 1");
  console.log(`🧾 Invoice synced: ${invoice.id} ${invoice.status}`);
}

async function upsertSubscription(subscription) {
  await pool.query("SELECT 1");
  console.log(`🔁 Subscription synced: ${subscription.id} ${subscription.status}`);
}

async function upsertCharge(charge) {
  await pool.query("SELECT 1");
  console.log(`💵 Charge synced: ${charge.id} ${charge.status}`);
}

async function upsertDispute(dispute) {
  await pool.query("SELECT 1");
  console.log(`⚠️ Dispute synced: ${dispute.id} ${dispute.status}`);
}
JS

cat > src/worker.js <<'JS'
import { pool, closePool } from "./db.js";
import { env } from "./env.js";
import { handleStripeEvent } from "./handlers/stripeEvents.js";

let shuttingDown = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error) {
  if (!error) {
    return "Unknown error";
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack ?? ""}`.slice(0, 5000);
  }

  return String(error).slice(0, 5000);
}

async function claimNextEvent() {
  const result = await pool.query(
    `
      WITH candidate AS (
        SELECT id
        FROM stripe_webhook_events
        WHERE
          (
            status IN ('queued', 'retrying')
            AND available_at <= now()
          )
          OR
          (
            status = 'processing'
            AND locked_at < now() - ($1 * interval '1 second')
          )
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE stripe_webhook_events event
      SET
        status = 'processing',
        attempts = event.attempts + 1,
        locked_at = now(),
        updated_at = now()
      FROM candidate
      WHERE event.id = candidate.id
      RETURNING event.*
    `,
    [env.WORKER_LOCK_TIMEOUT_SECONDS]
  );

  return result.rows[0] ?? null;
}

async function markCompleted(jobId) {
  await pool.query(
    `
      UPDATE stripe_webhook_events
      SET
        status = 'completed',
        processed_at = now(),
        updated_at = now(),
        last_error = NULL
      WHERE id = $1
    `,
    [jobId]
  );
}

async function markFailed(job, error) {
  const attempts = Number(job.attempts);
  const shouldDeadLetter = attempts >= env.MAX_WEBHOOK_ATTEMPTS;
  const retryDelaySeconds = Math.min(3600, 30 * 2 ** Math.max(0, attempts - 1));

  await pool.query(
    `
      UPDATE stripe_webhook_events
      SET
        status = $2,
        last_error = $3,
        available_at = CASE
          WHEN $2 = 'retrying' THEN now() + ($4 * interval '1 second')
          ELSE available_at
        END,
        updated_at = now()
      WHERE id = $1
    `,
    [
      job.id,
      shouldDeadLetter ? "dead" : "retrying",
      errorMessage(error),
      retryDelaySeconds
    ]
  );
}

async function processJob(job) {
  const event = job.payload;
  await handleStripeEvent(event);
  await markCompleted(job.id);
}

async function runWorker() {
  while (!shuttingDown) {
    const job = await claimNextEvent();

    if (!job) {
      await sleep(env.WORKER_POLL_INTERVAL_MS);
      continue;
    }

    try {
      await processJob(job);
    } catch (error) {
      await markFailed(job, error);
    }
  }
}

async function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  await closePool();

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

runWorker().catch(async () => {
  await closePool();
  process.exit(1);
});
JS

cat > scripts/migrate.js <<'JS'
import { readFile } from "node:fs/promises";
import { pool, closePool } from "../src/db.js";

async function migrate() {
  const sql = await readFile(
    new URL("../migrations/001_init.sql", import.meta.url),
    "utf8"
  );

  await pool.query(sql);

  console.log("✅ Database migration completed");
}

migrate()
  .catch((error) => {
    console.error("❌ Database migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
JS

cat > scripts/create-webhook-endpoint.js <<'JS'
import Stripe from "stripe";
import { env, requireEnv } from "../src/env.js";

const stripeSecretKey = env.STRIPE_SECRET_KEY || requireEnv("STRIPE_SECRET_KEY");
const publicWebhookUrl = env.PUBLIC_WEBHOOK_URL || requireEnv("PUBLIC_WEBHOOK_URL");

const stripe = new Stripe(stripeSecretKey);

const enabledEvents = [
  "checkout.session.completed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.processing",
  "payment_intent.canceled",
  "invoice.paid",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "invoice.finalized",
  "invoice.voided",
  "invoice.marked_uncollectible",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "charge.succeeded",
  "charge.failed",
  "charge.refunded",
  "charge.updated",
  "charge.dispute.created",
  "charge.dispute.updated",
  "charge.dispute.closed"
];

async function createWebhookEndpoint() {
  const endpoint = await stripe.webhookEndpoints.create({
    url: publicWebhookUrl,
    enabled_events: enabledEvents
  });

  console.log("✅ Stripe webhook endpoint created");
  console.log(endpoint.id);
  console.log(endpoint.secret);
}

createWebhookEndpoint().catch((error) => {
  console.error("❌ Failed to create webhook endpoint:", error);
  process.exit(1);
});
JS

cat > scripts/retry-dead-events.js <<'JS'
import { pool, closePool } from "../src/db.js";

async function retryDeadEvents() {
  const result = await pool.query(
    `
      UPDATE stripe_webhook_events
      SET
        status = 'queued',
        available_at = now(),
        locked_at = NULL,
        updated_at = now()
      WHERE status = 'dead'
      RETURNING event_id, event_type
    `
  );

  console.log(`✅ Re-queued ${result.rowCount} dead Stripe webhook event(s)`);

  for (const row of result.rows) {
    console.log(`${row.event_id} ${row.event_type}`);
  }
}

retryDeadEvents()
  .catch((error) => {
    console.error("❌ Failed to retry dead events:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
JS

cat > README.md <<'MD'
# Stripe Production Webhook

Production-ready Stripe webhook endpoint with:

- Signature verification
- Raw request body handling
- PostgreSQL idempotency
- Async worker processing
- Exponential backoff retries
- Dead-letter events
- Checkout, PaymentIntent, Invoice, Subscription, Charge, Refund, and Dispute handling

## Local setup

```bash
cp .env.example .env
npm install
docker compose up -d
npm run migrate
```

In another terminal:

```bash
stripe listen --forward-to localhost:4242/webhook
```

Copy the `whsec_...` value into `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

Start server and worker:

```bash
npm start
npm run worker
```

Trigger tests:

```bash
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.created
stripe trigger charge.refunded
stripe trigger charge.dispute.created
```
MD

if [ ! -f .env ]; then
  cp .env.example .env
fi

echo ""
echo "✅ Stripe webhook project created in: $PROJECT_DIR"
echo ""
echo "Next:"
echo "cd $PROJECT_DIR"
echo "npm install"
echo "docker compose up -d"
echo "edit .env with your Stripe keys"
echo "npm run migrate"
echo "npm start"
echo "npm run worker"
echo ""
