import { prisma } from "./prisma.js";

export async function withOrganizationContext<T>(
  organizationId: string,
  fn: Parameters<typeof prisma.$transaction>[0] extends (arg: infer U) => any
    ? (tx: U) => Promise<T>
    : never
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_organization_id', '${organizationId}', true)`
    );

    return fn(tx as never);
  });
}
