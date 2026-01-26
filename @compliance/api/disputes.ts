export type DisputeRecord = {
  id: string;
  status: "open" | "closed";
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

const disputes = new Map<string, DisputeRecord>();

export const createDispute = (
  id: string,
  data: Omit<DisputeRecord, "id">
): DisputeRecord => {
  if (disputes.has(id)) {
    throw new Error("Dispute already exists");
  }

  const record: DisputeRecord = {
    id,
    ...data,
  };

  disputes.set(id, record);
  return record;
};

export const getDispute = (id: string): DisputeRecord | undefined =>
  disputes.get(id);

export const listDisputes = (): DisputeRecord[] =>
  Array.from(disputes.values());
