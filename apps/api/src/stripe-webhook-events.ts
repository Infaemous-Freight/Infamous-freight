import { PrismaClient } from '@prisma/client';

export type StripeWebhookEventStatus = 'received' | 'processed' | 'failed' | 'ignored';

export type StripeWebhookEventInput = {
  eventId: string;
  eventType: string;
  carrierId?: string | null;
  status: StripeWebhookEventStatus;
  errorMessage?: string | null;
  processedAt?: Date | null;
};

interface StripeWebhookEventStore {
  upsert(input: StripeWebhookEventInput): Promise<void>;
}

class MemoryStripeWebhookEventStore implements StripeWebhookEventStore {
  private events = new Map<string, StripeWebhookEventInput>();

  async upsert(input: StripeWebhookEventInput): Promise<void> {
    const current = this.events.get(input.eventId);
    this.events.set(input.eventId, {
      ...current,
      ...input,
    });
  }
}

class PrismaStripeWebhookEventStore implements StripeWebhookEventStore {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(input: StripeWebhookEventInput): Promise<void> {
    await this.prisma.stripeWebhookEvent.upsert({
      where: { eventId: input.eventId },
      create: {
        eventId: input.eventId,
        eventType: input.eventType,
        carrierId: input.carrierId,
        status: input.status,
        errorMessage: input.errorMessage,
        processedAt: input.processedAt,
      },
      update: {
        eventType: input.eventType,
        carrierId: input.carrierId,
        status: input.status,
        errorMessage: input.errorMessage,
        processedAt: input.processedAt,
      },
    });
  }
}

let prismaClient: PrismaClient | null = null;
let memoryStore: MemoryStripeWebhookEventStore | null = null;

export function createStripeWebhookEventStore(): StripeWebhookEventStore {
  if (process.env.NODE_ENV === 'test') {
    memoryStore ??= new MemoryStripeWebhookEventStore();
    return memoryStore;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required outside of test mode.');
  }

  prismaClient ??= new PrismaClient();
  return new PrismaStripeWebhookEventStore(prismaClient);
}
