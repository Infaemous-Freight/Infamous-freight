export type DisputeStatus = "open" | "under_review" | "resolved" | "rejected";

export interface DisputeRecord {
  id: string;
  userId: string;
  transactionId: string;
  processor: "stripe" | "paypal" | "other";
  status: DisputeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisputeInput {
  userId: string;
  transactionId: string;
  processor: "stripe" | "paypal" | "other";
}

export interface UpdateDisputeInput {
  status?: DisputeStatus;
}

const disputes = new Map<string, DisputeRecord>();

export function createDispute(id: string, input: CreateDisputeInput): DisputeRecord {
  const now = new Date().toISOString();
  const record: DisputeRecord = {
    id,
    userId: input.userId,
    transactionId: input.transactionId,
    processor: input.processor,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };

  disputes.set(id, record);
  return record;
}

export function getDispute(id: string): DisputeRecord | undefined {
  return disputes.get(id);
}

export function updateDispute(id: string, input: UpdateDisputeInput): DisputeRecord | undefined {
  const existing = disputes.get(id);
  if (!existing) {
    return undefined;
  }

  const updated: DisputeRecord = {
    ...existing,
    status: input.status ?? existing.status,
    updatedAt: new Date().toISOString(),
  };

  disputes.set(id, updated);
  return updated;
}

export function deleteDispute(id: string): boolean {
  return disputes.delete(id);
}
