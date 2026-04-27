import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

export type AiUsageInput = {
  carrierId: string;
  feature: string;
  actionCount?: number;
  documentScans?: number;
  voiceMinutes?: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  idempotencyKey?: string;
  metadata?: Record<string, unknown> | string;
};

export type AiUsageRecord = {
  id: string;
  carrierId: string;
  feature: string;
  actionCount: number;
  documentScans: number;
  voiceMinutes: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  idempotencyKey?: string | null;
  metadata?: string | null;
  createdAt: Date | string;
};

export type AiUsageSummary = {
  carrierId: string;
  actionCount: number;
  documentScans: number;
  voiceMinutes: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
};

interface AiUsageStore {
  record(input: AiUsageInput): Promise<AiUsageRecord>;
  summarize(carrierId: string): Promise<AiUsageSummary>;
}

function toNumber(value: unknown, fallback = 0): number {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) ? number : fallback;
}

function stringifyMetadata(metadata: AiUsageInput['metadata']): string | undefined {
  if (!metadata) {
    return undefined;
  }

  return typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
}

class MemoryAiUsageStore implements AiUsageStore {
  private records: AiUsageRecord[] = [];

  async record(input: AiUsageInput): Promise<AiUsageRecord> {
    if (input.idempotencyKey) {
      const existing = this.records.find(
        (record) => record.carrierId === input.carrierId && record.idempotencyKey === input.idempotencyKey,
      );

      if (existing) {
        return existing;
      }
    }

    const record: AiUsageRecord = {
      id: randomUUID(),
      carrierId: input.carrierId,
      feature: input.feature,
      actionCount: toNumber(input.actionCount, 1),
      documentScans: toNumber(input.documentScans),
      voiceMinutes: toNumber(input.voiceMinutes),
      inputTokens: toNumber(input.inputTokens),
      outputTokens: toNumber(input.outputTokens),
      estimatedCost: toNumber(input.estimatedCost),
      idempotencyKey: input.idempotencyKey,
      metadata: stringifyMetadata(input.metadata),
      createdAt: new Date().toISOString(),
    };

    this.records.push(record);
    return record;
  }

  async summarize(carrierId: string): Promise<AiUsageSummary> {
    return this.records
      .filter((record) => record.carrierId === carrierId)
      .reduce<AiUsageSummary>((summary, record) => ({
        carrierId,
        actionCount: summary.actionCount + record.actionCount,
        documentScans: summary.documentScans + record.documentScans,
        voiceMinutes: summary.voiceMinutes + record.voiceMinutes,
        inputTokens: summary.inputTokens + record.inputTokens,
        outputTokens: summary.outputTokens + record.outputTokens,
        estimatedCost: summary.estimatedCost + record.estimatedCost,
      }), {
        carrierId,
        actionCount: 0,
        documentScans: 0,
        voiceMinutes: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: 0,
      });
  }
}

class PrismaAiUsageStore implements AiUsageStore {
  constructor(private readonly prisma: PrismaClient) {}

  async record(input: AiUsageInput): Promise<AiUsageRecord> {
    const data = {
      carrierId: input.carrierId,
      feature: input.feature,
      actionCount: toNumber(input.actionCount, 1),
      documentScans: toNumber(input.documentScans),
      voiceMinutes: toNumber(input.voiceMinutes),
      inputTokens: toNumber(input.inputTokens),
      outputTokens: toNumber(input.outputTokens),
      estimatedCost: toNumber(input.estimatedCost),
      idempotencyKey: input.idempotencyKey,
      metadata: stringifyMetadata(input.metadata),
    };

    if (input.idempotencyKey) {
      return this.prisma.aiUsageEvent.upsert({
        where: {
          carrierId_idempotencyKey: {
            carrierId: input.carrierId,
            idempotencyKey: input.idempotencyKey,
          },
        },
        create: data,
        update: {},
      });
    }

    return this.prisma.aiUsageEvent.create({ data });
  }

  async summarize(carrierId: string): Promise<AiUsageSummary> {
    const aggregate = await this.prisma.aiUsageEvent.aggregate({
      where: { carrierId },
      _sum: {
        actionCount: true,
        documentScans: true,
        voiceMinutes: true,
        inputTokens: true,
        outputTokens: true,
        estimatedCost: true,
      },
    });

    return {
      carrierId,
      actionCount: aggregate._sum.actionCount ?? 0,
      documentScans: aggregate._sum.documentScans ?? 0,
      voiceMinutes: aggregate._sum.voiceMinutes ?? 0,
      inputTokens: aggregate._sum.inputTokens ?? 0,
      outputTokens: aggregate._sum.outputTokens ?? 0,
      estimatedCost: aggregate._sum.estimatedCost ?? 0,
    };
  }
}

let prismaClient: PrismaClient | null = null;
let memoryStore: MemoryAiUsageStore | null = null;

export function createAiUsageStore(): AiUsageStore {
  if (process.env.NODE_ENV === 'test') {
    memoryStore ??= new MemoryAiUsageStore();
    return memoryStore;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required outside of test mode.');
  }

  prismaClient ??= new PrismaClient();
  return new PrismaAiUsageStore(prismaClient);
}
