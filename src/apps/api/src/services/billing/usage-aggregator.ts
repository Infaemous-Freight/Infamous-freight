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
  throw new Error(
    `unimplemented: computeOverageForTenant tenantId=${tenantId} periodStart=${periodStart} periodEnd=${periodEnd}`,
  );
}
