import { createStripeOneTimePaymentStore } from '../src/stripe-one-time-payments';

describe('createStripeOneTimePaymentStore', () => {
  let previousNodeEnv: string | undefined;
  let previousDatabaseUrl: string | undefined;

  beforeEach(() => {
    previousNodeEnv = process.env.NODE_ENV;
    previousDatabaseUrl = process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }

    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });

  it('returns a memory store in test mode without throwing', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.DATABASE_URL;

    expect(() => createStripeOneTimePaymentStore()).not.toThrow();
  });

  it('reuses the same in-memory store instance in test mode', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.DATABASE_URL;

    const storeA = createStripeOneTimePaymentStore();
    const storeB = createStripeOneTimePaymentStore();

    expect(storeA).toBe(storeB);
  });

  it('requires DATABASE_URL outside of test mode', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DATABASE_URL;

    expect(() => createStripeOneTimePaymentStore()).toThrow(
      'DATABASE_URL is required outside of test mode.',
    );
  });
});

describe('MemoryStripeOneTimePaymentStore upsert', () => {
  let previousNodeEnv: string | undefined;
  let previousDatabaseUrl: string | undefined;

  beforeEach(() => {
    previousNodeEnv = process.env.NODE_ENV;
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.NODE_ENV = 'test';
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }

    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });

  it('upserts a payment record without throwing', async () => {
    const store = createStripeOneTimePaymentStore();

    await expect(
      store.upsert({
        eventId: 'evt_upsert_1',
        carrierId: 'carrier_upsert_1',
        stripeCustomerId: 'cus_upsert_1',
        stripeCheckoutSessionId: 'cs_upsert_1',
        stripePaymentIntentId: 'pi_upsert_1',
        amountTotal: 4900,
        currency: 'usd',
        status: 'paid',
        purchaseType: 'ai_addon_pack',
        priceId: 'price_upsert_1',
      }),
    ).resolves.toBeUndefined();
  });

  it('overwrites an existing record when the same stripeCheckoutSessionId is used', async () => {
    const store = createStripeOneTimePaymentStore();

    const sharedSessionId = 'cs_upsert_merge';

    await store.upsert({
      eventId: 'evt_upsert_original',
      carrierId: 'carrier_upsert_merge',
      stripeCustomerId: 'cus_upsert_merge',
      stripeCheckoutSessionId: sharedSessionId,
      stripePaymentIntentId: 'pi_original',
      amountTotal: 4900,
      currency: 'usd',
      status: 'pending',
      purchaseType: 'ai_addon_pack',
      priceId: 'price_merge',
    });

    // Second upsert with same session ID — should merge/overwrite
    await expect(
      store.upsert({
        eventId: 'evt_upsert_updated',
        carrierId: 'carrier_upsert_merge',
        stripeCustomerId: 'cus_upsert_merge',
        stripeCheckoutSessionId: sharedSessionId,
        stripePaymentIntentId: 'pi_updated',
        amountTotal: 4900,
        currency: 'usd',
        status: 'paid',
        purchaseType: 'ai_addon_pack',
        priceId: 'price_merge',
      }),
    ).resolves.toBeUndefined();
  });
});
