import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient | null {
  if (env.persistenceMode === "json") return null;
  if (!env.databaseUrl) return null;

  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function closePrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
