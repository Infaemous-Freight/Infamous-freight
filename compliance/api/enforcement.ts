import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function enforce(userId: string, level: string, reason: string) {
  try {
    return await prisma.enforcementAction.create({
      data: { userId, level, reason },
    });
  } catch (error) {
    console.error("Failed to create enforcement action", {
      userId,
      level,
      reason,
      error,
    });
    throw error;
  }
}
