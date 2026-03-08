import { prisma } from "./prisma.js";
import { Prisma } from "@prisma/client";

export async function withOrganizationContext<T>(
  organizationId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.current_organization_id', ${organizationId}, true)`
    );

    return fn(tx);
  });
}
