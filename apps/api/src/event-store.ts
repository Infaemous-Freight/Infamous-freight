import { randomUUID } from 'crypto';

export interface AiDecisionLogRecord {
  id: string;
  tenantId: string;
  userId: string;
  decisionType: string;
  model: string;
  input: unknown;
  output: unknown;
  createdAt: string;
}

export interface BillingEventRecord {
  id: string;
  tenantId: string;
  idempotencyKey: string;
  eventType: string;
  payload: unknown;
  createdAt: string;
}

const aiDecisionLogs: AiDecisionLogRecord[] = [];
const billingEventsByTenantKey = new Map<string, BillingEventRecord>();

function tenantBillingKey(tenantId: string, idempotencyKey: string): string {
  return `${tenantId}:${idempotencyKey}`;
}

export function recordAiDecision(input: Omit<AiDecisionLogRecord, 'id' | 'createdAt'>): AiDecisionLogRecord {
  const log: AiDecisionLogRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };

  aiDecisionLogs.push(log);

  return log;
}

export function getAiDecisionLogsForTenant(tenantId: string): AiDecisionLogRecord[] {
  return aiDecisionLogs.filter((log) => log.tenantId === tenantId);
}

export function upsertBillingEvent(input: Omit<BillingEventRecord, 'id' | 'createdAt'>): {
  event: BillingEventRecord;
  deduplicated: boolean;
} {
  const key = tenantBillingKey(input.tenantId, input.idempotencyKey);
  const existing = billingEventsByTenantKey.get(key);

  if (existing) {
    return {
      event: existing,
      deduplicated: true,
    };
  }

  const event: BillingEventRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };

  billingEventsByTenantKey.set(key, event);

  return {
    event,
    deduplicated: false,
  };
}

export function resetEventStore(): void {
  aiDecisionLogs.length = 0;
  billingEventsByTenantKey.clear();
}
