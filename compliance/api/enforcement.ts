import prisma from "../db";

export async function enforce(userId: string, level: string, reason: string) {
  return prisma.enforcementAction.create({
    data: { userId, level, reason },
  });
}
