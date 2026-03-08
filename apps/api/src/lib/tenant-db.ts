import { prisma } from "./prisma.js";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function withOrganizationContext<T>(
  organizationId: string,
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT set_config('app.current_organization_id', ${organizationId}, true)
    `;
    return fn(tx);
  });
}
