import { getDatabase } from '@netlify/database';
import type { Config } from '@netlify/functions';
import { withSentry } from './lib/sentry.ts';

const REQUIRED_ENV = [
  'NETLIFY_SITE_ID',
  'URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SENTRY_DSN',
];

const RECOMMENDED_SERVER_ENV = [
  'DATABASE_URL',
  'NETLIFY_DB_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SENTRY_DSN',
  'SENDGRID_API_KEY',
  'FROM_EMAIL',
];

const REQUIRED_TABLES = [
  'public_quote_requests',
  'public_shipments',
  'carriers',
  'users',
  'loads',
  'quotes',
  'gps_positions',
  'invoices',
  'invoice_line_items',
  'notifications',
];

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
    },
  });

const hasValue = (name: string) => Boolean(process.env[name]?.trim());

async function checkTables() {
  const db = getDatabase();
  const rows = await db.sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `;
  const present = new Set(rows.map((row: Record<string, unknown>) => String(row.table_name)));
  const missing = REQUIRED_TABLES.filter((table) => !present.has(table));

  return {
    ok: missing.length === 0,
    present: REQUIRED_TABLES.filter((table) => present.has(table)),
    missing,
  };
}

export default withSentry(async () => {
  const missingRequiredEnv = REQUIRED_ENV.filter((name) => !hasValue(name));
  const missingRecommendedEnv = RECOMMENDED_SERVER_ENV.filter((name) => !hasValue(name));

  let database;
  try {
    database = await checkTables();
  } catch {
    database = {
      ok: false,
      present: [],
      missing: REQUIRED_TABLES,
    };
  }

  const ok = missingRequiredEnv.length === 0 && database.ok;

  return json(ok ? 200 : 503, {
    ok,
    service: 'infamous-freight',
    timestamp: new Date().toISOString(),
    checks: {
      requiredEnv: {
        ok: missingRequiredEnv.length === 0,
        missing: missingRequiredEnv,
      },
      recommendedServerEnv: {
        ok: missingRecommendedEnv.length === 0,
        missing: missingRecommendedEnv,
      },
      database,
      sentry: {
        ok: hasValue('SENTRY_DSN') || hasValue('VITE_SENTRY_DSN'),
      },
    },
  });
});

export const config: Config = {
  path: ['/api/production-health', '/production-health'],
};
