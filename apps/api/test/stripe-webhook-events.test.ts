import { createStripeWebhookEventStore } from '../src/stripe-webhook-events';

describe('createStripeWebhookEventStore', () => {
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

  it('returns a memory store in test mode', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.DATABASE_URL;

    expect(() => createStripeWebhookEventStore()).not.toThrow();
  });

  it('reuses the same in-memory store in test mode', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.DATABASE_URL;

    const firstStore = createStripeWebhookEventStore();
    const secondStore = createStripeWebhookEventStore();

    expect(firstStore).toBe(secondStore);

    await expect(
      firstStore.upsert({
        eventId: 'evt_test_memory',
        eventType: 'checkout.session.completed',
        status: 'received',
      })
    ).resolves.toBeUndefined();
  });

  it('requires DATABASE_URL outside test mode', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DATABASE_URL;

    expect(() => createStripeWebhookEventStore()).toThrow(
      'DATABASE_URL is required outside of test mode.'
    );
  });
});
