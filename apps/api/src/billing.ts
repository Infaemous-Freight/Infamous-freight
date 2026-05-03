import crypto from 'crypto';

export type BillingPlan = 'starter' | 'professional' | 'enterprise';
export type BillingInterval = 'month' | 'year';
export type BillingStatus = 'active' | 'trial' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'inactive';

export type BillingSyncPayload = {
  carrierId?: string;
  stripeCustomerId?: string;
  subscriptionTier?: BillingPlan;
  status?: BillingStatus;
};

export type CheckoutSessionInput = {
  carrierId: string;
  plan: BillingPlan;
  billingInterval: BillingInterval;
  stripeCustomerId?: string | null;
};

export type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;
const STRIPE_CHECKOUT_SESSION_TOKEN = '{CHECKOUT_SESSION_ID}';

const PRICE_BY_PLAN_INTERVAL: Record<BillingPlan, Record<BillingInterval, string>> = {
  starter: {
    month: 'price_1TBnZ2KCNuZqDozYEcW5j4xM',
    year: 'price_1TBnZ3KCNuZqDozYvHBLW9L3',
  },
  professional: {
    month: 'price_1TBnZ3KCNuZqDozY2FISQT98',
    year: 'price_1TBnZ4KCNuZqDozYO9YCSWIr',
  },
  enterprise: {
    month: 'price_1TBnZ3KCNuZqDozYUG5nsCHt',
    year: 'price_1TBnZ4KCNuZqDozYy4qS3Kvy',
  },
};

const PLAN_BY_PRICE_ID: Record<string, BillingPlan> = Object.entries(PRICE_BY_PLAN_INTERVAL).reduce(
  (acc, [plan, intervals]) => ({
    ...acc,
    [intervals.month]: plan as BillingPlan,
    [intervals.year]: plan as BillingPlan,
  }),
  {} as Record<string, BillingPlan>,
);

export function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function getBillingPortalReturnUrl(): string {
  return process.env.STRIPE_PORTAL_RETURN_URL?.trim()
    || process.env.WEB_APP_URL?.trim()
    || 'http://localhost:5173/settings';
}

function getCheckoutBaseUrl(path: 'success' | 'canceled'): string {
  const explicitUrl = path === 'success'
    ? process.env.STRIPE_CHECKOUT_SUCCESS_URL?.trim()
    : process.env.STRIPE_CHECKOUT_CANCEL_URL?.trim();

  if (explicitUrl) {
    return explicitUrl;
  }

  const checkoutStatus = path === 'success' ? 'success' : 'canceled';
  return `${process.env.WEB_APP_URL?.trim() || 'http://localhost:5173'}/settings?checkout=${checkoutStatus}`;
}

function appendCheckoutSessionIdToken(url: string): string {
  if (url.includes(STRIPE_CHECKOUT_SESSION_TOKEN) || url.includes('session_id=')) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}session_id=${STRIPE_CHECKOUT_SESSION_TOKEN}`;
}

function getCheckoutSuccessUrl(): string {
  return appendCheckoutSessionIdToken(getCheckoutBaseUrl('success'));
}

function getCheckoutCancelUrl(): string {
  return getCheckoutBaseUrl('canceled');
}

export function verifyStripeWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  webhookSecret: string | null = getStripeWebhookSecret(),
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!webhookSecret || !signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(',').reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split('=');
    if (!key || !value) {
      return acc;
    }
    acc[key] = [...(acc[key] ?? []), value];
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  if (Math.abs(nowSeconds - timestampNumber) > STRIPE_SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return signatures.some((signature) => {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    return expectedBuffer.length === signatureBuffer.length
      && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  });
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function getMetadata(object: Record<string, unknown>): Record<string, unknown> {
  return getRecord(object.metadata) ?? {};
}

function getCustomerId(object: Record<string, unknown>): string | undefined {
  const customer = object.customer;
  if (typeof customer === 'string') {
    return customer;
  }

  return getString(getRecord(customer)?.id);
}

function mapStripeStatus(status: string | undefined): BillingStatus {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trial';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'unpaid':
      return 'unpaid';
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete';
    default:
      return 'inactive';
  }
}

function getPlanFromSubscription(object: Record<string, unknown>): BillingPlan | undefined {
  const metadataPlan = getString(getMetadata(object).plan) as BillingPlan | undefined;
  if (metadataPlan === 'starter' || metadataPlan === 'professional' || metadataPlan === 'enterprise') {
    return metadataPlan;
  }

  const items = getRecord(object.items);
  const data = Array.isArray(items?.data) ? items.data : [];
  const firstItem = getRecord(data[0]);
  const price = getRecord(firstItem?.price);
  const priceId = getString(price?.id);

  return priceId ? PLAN_BY_PRICE_ID[priceId] : undefined;
}

export function getBillingSyncFromStripeEvent(event: StripeEvent): BillingSyncPayload | null {
  const object = event.data.object;
  const metadata = getMetadata(object);
  const carrierId = getString(metadata.carrierId);
  const stripeCustomerId = getCustomerId(object);

  switch (event.type) {
    case 'checkout.session.completed': {
      const plan = getString(metadata.plan) as BillingPlan | undefined;
      return {
        carrierId,
        stripeCustomerId,
        subscriptionTier: plan === 'starter' || plan === 'professional' || plan === 'enterprise' ? plan : undefined,
        status: 'active',
      };
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      return {
        carrierId,
        stripeCustomerId,
        subscriptionTier: getPlanFromSubscription(object),
        status: mapStripeStatus(getString(object.status)),
      };
    }
    case 'customer.subscription.deleted': {
      return {
        carrierId,
        stripeCustomerId,
        status: 'canceled',
      };
    }
    case 'invoice.payment_succeeded': {
      return {
        stripeCustomerId,
        status: 'active',
      };
    }
    case 'invoice.payment_failed': {
      return {
        stripeCustomerId,
        status: 'past_due',
      };
    }
    default:
      return null;
  }
}

async function postStripeForm<T>(path: string, body: URLSearchParams): Promise<T> {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    throw new Error('stripe_secret_key_required');
  }

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const json = await response.json() as T & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(json.error?.message ?? 'stripe_request_failed');
  }

  return json;
}

export async function createStripeCheckoutSession(input: CheckoutSessionInput): Promise<string> {
  const price = PRICE_BY_PLAN_INTERVAL[input.plan]?.[input.billingInterval];

  if (!price) {
    throw new Error('invalid_checkout_plan');
  }

  const body = new URLSearchParams({
    mode: 'subscription',
    success_url: getCheckoutSuccessUrl(),
    cancel_url: getCheckoutCancelUrl(),
    'line_items[0][price]': price,
    'line_items[0][quantity]': '1',
    'metadata[carrierId]': input.carrierId,
    'metadata[plan]': input.plan,
    'metadata[billingInterval]': input.billingInterval,
    'subscription_data[metadata][carrierId]': input.carrierId,
    'subscription_data[metadata][plan]': input.plan,
    'subscription_data[metadata][billingInterval]': input.billingInterval,
  });

  if (input.stripeCustomerId) {
    body.set('customer', input.stripeCustomerId);
  } else {
    body.set('client_reference_id', input.carrierId);
  }

  const session = await postStripeForm<{ url?: string }>('/checkout/sessions', body);

  if (!session.url) {
    throw new Error('stripe_checkout_session_failed');
  }

  return session.url;
}

export async function createStripeBillingPortalSession(customerId: string): Promise<string> {
  const session = await postStripeForm<{ url?: string }>('/billing_portal/sessions', new URLSearchParams({
    customer: customerId,
    return_url: getBillingPortalReturnUrl(),
  }));

  if (!session.url) {
    throw new Error('stripe_portal_session_failed');
  }

  return session.url;
}
