import { prisma } from "./prisma.js";

export async function withOrganizationContext<T>(
  organizationId: string,
  fn: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx: typeof prisma) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_organization_id', $1, true)`,
      organizationId
    );

    return fn(tx as typeof prisma);
  });
}
