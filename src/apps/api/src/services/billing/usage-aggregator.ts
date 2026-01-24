export type UsageTotals = {
  totalQuantity: number;
  includedQuantity: number;
  overageQuantity: number;
};

export async function computeOverageForTenant(
  tenantId: string,
  periodStart: number,
  periodEnd: number,
): Promise<UsageTotals> {
  // NOTE: Implementation pending. Keep error message generic to avoid leaking internal identifiers.
  throw new Error("unimplemented: computeOverageForTenant");
}
}
