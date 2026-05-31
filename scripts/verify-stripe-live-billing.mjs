#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const API_BASE_URL = (process.env.BILLING_VERIFY_API_BASE_URL || 'https://infamous-freight-api.fly.dev').replace(/\/$/, '');
const FLY_APP = process.env.BILLING_VERIFY_FLY_APP || 'infamous-freight-api';
const WEBHOOK_URL = process.env.BILLING_VERIFY_WEBHOOK_URL || `${API_BASE_URL}/api/billing/webhook`;
const PLAN = process.env.BILLING_VERIFY_PLAN || 'starter';
const BILLING_INTERVAL = process.env.BILLING_VERIFY_INTERVAL || 'month';
const TENANT_ID = process.env.BILLING_VERIFY_TENANT_ID || '';
const BEARER_TOKEN = process.env.BILLING_VERIFY_BEARER_TOKEN || '';
const CHECKOUT_SESSION_ID = process.env.BILLING_VERIFY_CHECKOUT_SESSION_ID || '';
const PRINT_CHECKOUT_URL = process.env.BILLING_VERIFY_PRINT_CHECKOUT_URL === 'true';
const CREATE_CHECKOUT = process.env.BILLING_VERIFY_CREATE_CHECKOUT === 'true';
const REQUIRE_CREDENTIALS = process.env.BILLING_VERIFY_REQUIRE_CREDENTIALS === 'true';
const REQUIRE_PAYMENT = process.env.BILLING_VERIFY_REQUIRE_PAYMENT === 'true';

const requiredWebhookEvents = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'charge.refunded',
  'charge.dispute.created',
];

const subscriptionPriceIds = [
  'price_1TBnZ2KCNuZqDozYEcW5j4xM',
  'price_1TBnZ3KCNuZqDozYvHBLW9L3',
  'price_1TBnZ3KCNuZqDozY2FISQT98',
  'price_1TBnZ4KCNuZqDozYO9YCSWIr',
  'price_1TBnZ3KCNuZqDozYUG5nsCHt',
  'price_1TBnZ4KCNuZqDozYy4qS3Kvy',
];

const oneTimePriceIds = [
  'price_1TQeyLKCNuZqDozY0tb8Mwt8',
  'price_1TQf0BKCNuZqDozYU5RBJVKo',
  'price_1TQf0TKCNuZqDozY3dghvydQ',
  'price_1TQf0zKCNuZqDozYJSTRv4iY',
  'price_1TQf1IKCNuZqDozYebKKmHpu',
];

const results = [];

function record(status, check, details = '') {
  results.push({ status, check, details });
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${check}${details ? ` — ${details}` : ''}`);
}

function fail(check, details = '') {
  record('FAIL', check, details);
}

function warn(check, details = '') {
  record('WARN', check, details);
}

function pass(check, details = '') {
  record('PASS', check, details);
}

function skip(check, details = '', strict = REQUIRE_CREDENTIALS) {
  if (strict) {
    fail(check, details || 'required credential or opt-in flag is missing');
    return;
  }

  warn(check, details);
}

function redactIdentifier(value) {
  if (typeof value !== 'string' || value.length <= 8) {
    return 'redacted';
  }

  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

async function requestPublicJsonWithCurlFallback(url) {
  try {
    return await requestJson(url);
  } catch (fetchError) {
    try {
      const { stdout } = await execFileAsync('curl', ['-sS', '-L', '--max-time', '20', '-w', '\n%{http_code}', url]);
      const separatorIndex = stdout.lastIndexOf('\n');
      const text = separatorIndex >= 0 ? stdout.slice(0, separatorIndex) : stdout;
      const statusCode = Number(separatorIndex >= 0 ? stdout.slice(separatorIndex + 1) : 0);
      let body = null;

      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = { raw: text.slice(0, 200) };
        }
      }

      return {
        response: { ok: statusCode >= 200 && statusCode < 300, status: statusCode },
        body,
      };
    } catch {
      throw fetchError;
    }
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 200) };
    }
  }

  return { response, body };
}

function stripeHeaders() {
  return { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` };
}

async function verifyApiLiveness() {
  try {
    const { response, body } = await requestPublicJsonWithCurlFallback(`${API_BASE_URL}/api/health/live`);
    if (response.ok && body?.status === 'ok') {
      pass('Fly API liveness', `${response.status} ${API_BASE_URL}/api/health/live`);
      return;
    }

    fail('Fly API liveness', `HTTP ${response.status}; expected status=ok`);
  } catch (error) {
    fail('Fly API liveness', error instanceof Error ? error.message : String(error));
  }
}

async function verifyStripeAccount() {
  if (!process.env.STRIPE_SECRET_KEY) {
    skip('Stripe API account check skipped', 'set STRIPE_SECRET_KEY in the operator terminal; do not paste it into logs');
    return;
  }

  try {
    const { response, body } = await requestJson('https://api.stripe.com/v1/account', { headers: stripeHeaders() });
    if (!response.ok) {
      fail('Stripe API account check', `HTTP ${response.status}`);
      return;
    }

    if (body?.livemode !== true) {
      fail('Stripe API account mode', 'STRIPE_SECRET_KEY is not a live-mode key');
      return;
    }

    const expectedAccountId = process.env.STRIPE_ACCOUNT_ID?.trim();
    if (expectedAccountId && body?.id !== expectedAccountId) {
      fail('Stripe account ID match', `expected ${expectedAccountId}, got ${body?.id || 'unknown'}`);
      return;
    }

    pass('Stripe API account check', `live account ${redactIdentifier(body?.id)}`);
  } catch (error) {
    fail('Stripe API account check', error instanceof Error ? error.message : String(error));
  }
}

async function verifyStripePrices() {
  if (!process.env.STRIPE_SECRET_KEY) {
    skip('Stripe price catalog check skipped', 'set STRIPE_SECRET_KEY to verify live Price IDs');
    return;
  }

  const ids = [...subscriptionPriceIds, ...oneTimePriceIds];
  let failures = 0;

  for (const id of ids) {
    try {
      const { response, body } = await requestJson(`https://api.stripe.com/v1/prices/${encodeURIComponent(id)}`, { headers: stripeHeaders() });
      if (!response.ok) {
        failures += 1;
        fail(`Stripe Price ${id}`, `HTTP ${response.status}`);
        continue;
      }

      if (body?.livemode !== true || body?.active !== true) {
        failures += 1;
        fail(`Stripe Price ${id}`, `livemode=${body?.livemode} active=${body?.active}`);
        continue;
      }

      pass(`Stripe Price ${id}`, `${body?.currency || 'unknown'} ${body?.type || 'unknown'}`);
    } catch (error) {
      failures += 1;
      fail(`Stripe Price ${id}`, error instanceof Error ? error.message : String(error));
    }
  }

  if (failures === 0) {
    pass('Stripe price catalog check', `${ids.length} live active prices verified`);
  }
}

async function verifyWebhookEndpoint() {
  if (!process.env.STRIPE_SECRET_KEY) {
    skip('Stripe webhook endpoint check skipped', 'set STRIPE_SECRET_KEY to inspect dashboard configuration');
    return;
  }

  try {
    const { response, body } = await requestJson('https://api.stripe.com/v1/webhook_endpoints?limit=100', { headers: stripeHeaders() });
    if (!response.ok) {
      fail('Stripe webhook endpoint check', `HTTP ${response.status}`);
      return;
    }

    const endpoints = Array.isArray(body?.data) ? body.data : [];
    const endpoint = endpoints.find((item) => item?.url === WEBHOOK_URL);
    if (!endpoint) {
      fail('Stripe webhook endpoint configured', `missing ${WEBHOOK_URL}`);
      return;
    }

    if (endpoint.status !== 'enabled') {
      fail('Stripe webhook endpoint enabled', `status=${endpoint.status || 'unknown'}`);
      return;
    }

    const enabledEvents = Array.isArray(endpoint.enabled_events) ? endpoint.enabled_events : [];
    const missingEvents = requiredWebhookEvents.filter((event) => !enabledEvents.includes(event) && !enabledEvents.includes('*'));
    if (missingEvents.length > 0) {
      fail('Stripe webhook subscribed events', `missing ${missingEvents.join(', ')}`);
      return;
    }

    pass('Stripe webhook endpoint check', `${redactIdentifier(endpoint.id)} enabled for required billing events`);
  } catch (error) {
    fail('Stripe webhook endpoint check', error instanceof Error ? error.message : String(error));
  }
}

async function createCheckoutSession() {
  if (!CREATE_CHECKOUT) {
    warn('Checkout Session creation skipped', 'set BILLING_VERIFY_CREATE_CHECKOUT=true after live payment approval');
    return;
  }

  if (!BEARER_TOKEN) {
    fail('Checkout Session creation failed', 'set BILLING_VERIFY_BEARER_TOKEN for an owner/admin Supabase JWT');
    return;
  }

  try {
    const headers = {
      Authorization: `Bearer ${BEARER_TOKEN}`,
      'Content-Type': 'application/json',
    };

    if (TENANT_ID) {
      headers['x-tenant-id'] = TENANT_ID;
    }

    const { response, body } = await requestJson(`${API_BASE_URL}/api/billing/checkout-session`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ plan: PLAN, billingInterval: BILLING_INTERVAL }),
    });

    if (!response.ok) {
      fail('Create live Checkout Session', `HTTP ${response.status}; error=${body?.error || 'unknown'}`);
      return;
    }

    const checkoutUrl = body?.data?.url;
    if (typeof checkoutUrl !== 'string' || !checkoutUrl.startsWith('https://checkout.stripe.com/')) {
      fail('Create live Checkout Session', 'response did not include a Stripe Checkout URL');
      return;
    }

    let sessionId = 'unknown';
    try {
      sessionId = new URL(checkoutUrl).pathname.split('/').filter(Boolean).pop() || 'unknown';
    } catch {
      // Keep redacted fallback.
    }

    pass('Create live Checkout Session', `session=${redactIdentifier(sessionId)}`);
    if (PRINT_CHECKOUT_URL) {
      console.log(`Checkout URL for approved operator use only: ${checkoutUrl}`);
    } else {
      warn('Checkout URL redacted', 'set BILLING_VERIFY_PRINT_CHECKOUT_URL=true only in an approved operator terminal');
    }
  } catch (error) {
    fail('Create live Checkout Session', error instanceof Error ? error.message : String(error));
  }
}

async function verifyCheckoutSessionPayment() {
  if (!CHECKOUT_SESSION_ID) {
    skip('Checkout payment verification skipped', 'set BILLING_VERIFY_CHECKOUT_SESSION_ID after completing the approved live checkout', REQUIRE_PAYMENT);
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    fail('Checkout payment verification failed', 'set STRIPE_SECRET_KEY to retrieve the Checkout Session from Stripe');
    return;
  }

  try {
    const url = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(CHECKOUT_SESSION_ID)}`;
    const { response, body } = await requestJson(url, { headers: stripeHeaders() });
    if (!response.ok) {
      fail('Checkout payment verification', `HTTP ${response.status}`);
      return;
    }

    if (body?.livemode !== true) {
      fail('Checkout payment verification', 'session is not live mode');
      return;
    }

    if (body?.payment_status !== 'paid') {
      fail('Checkout payment verification', `payment_status=${body?.payment_status || 'unknown'}`);
      return;
    }

    pass('Checkout payment verification', 'payment_status=paid');
  } catch (error) {
    fail('Checkout payment verification', error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log('Infamous Freight — live Stripe billing verification');
  console.log(`API base URL: ${API_BASE_URL}`);
  console.log(`Fly app: ${FLY_APP}`);
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log('Secrets are never printed by this script.');
  console.log(`Checkout creation enabled: ${CREATE_CHECKOUT ? 'yes' : 'no'}; strict credential mode: ${REQUIRE_CREDENTIALS ? 'yes' : 'no'}; require payment verification: ${REQUIRE_PAYMENT ? 'yes' : 'no'}\n`);

  await verifyApiLiveness();
  await verifyStripeAccount();
  await verifyStripePrices();
  await verifyWebhookEndpoint();
  await createCheckoutSession();
  await verifyCheckoutSessionPayment();

  const failed = results.filter((result) => result.status === 'FAIL').length;
  const warned = results.filter((result) => result.status === 'WARN').length;
  console.log(`\nSummary: ${failed} failed, ${warned} warning/skipped, ${results.length} total checks.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
