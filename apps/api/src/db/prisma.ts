import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function closePrisma(): Promise<void> {
  await prisma.$disconnect();
}
