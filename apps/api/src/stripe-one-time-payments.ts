import { PrismaClient } from '@prisma/client';
import { StripeOneTimePaymentPayload } from './billing';
import { createPrismaClient } from './prisma-client';

export type StripeOneTimePaymentInput = StripeOneTimePaymentPayload;

interface StripeOneTimePaymentStore {
  upsert(input: StripeOneTimePaymentInput): Promise<void>;
}

class MemoryStripeOneTimePaymentStore implements StripeOneTimePaymentStore {
  private payments = new Map<string, StripeOneTimePaymentInput>();

  async upsert(input: StripeOneTimePaymentInput): Promise<void> {
    const current = this.payments.get(input.stripeCheckoutSessionId);
    this.payments.set(input.stripeCheckoutSessionId, {
      ...current,
      ...input,
    });
  }
}

class PrismaStripeOneTimePaymentStore implements StripeOneTimePaymentStore {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(input: StripeOneTimePaymentInput): Promise<void> {
    await this.prisma.stripeOneTimePayment.upsert({
      where: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
      create: {
        eventId: input.eventId,
        carrierId: input.carrierId,
        stripeCustomerId: input.stripeCustomerId,
        stripeCheckoutSessionId: input.stripeCheckoutSessionId,
        stripePaymentIntentId: input.stripePaymentIntentId,
        amountTotal: input.amountTotal,
        currency: input.currency,
        status: input.status,
        purchaseType: input.purchaseType,
        priceId: input.priceId,
      },
      update: {
        eventId: input.eventId,
        carrierId: input.carrierId,
        stripeCustomerId: input.stripeCustomerId,
        stripePaymentIntentId: input.stripePaymentIntentId,
        amountTotal: input.amountTotal,
        currency: input.currency,
        status: input.status,
        purchaseType: input.purchaseType,
        priceId: input.priceId,
      },
    });
  }
}

let prismaClient: PrismaClient | null = null;
let memoryStore: MemoryStripeOneTimePaymentStore | null = null;

export function createStripeOneTimePaymentStore(): StripeOneTimePaymentStore {
  if (process.env.NODE_ENV === 'test') {
    memoryStore ??= new MemoryStripeOneTimePaymentStore();
    return memoryStore;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required outside of test mode.');
  }

  prismaClient ??= createPrismaClient();
  return new PrismaStripeOneTimePaymentStore(prismaClient);
}
