import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { env } from "../config/env.js";

let prismaClient: PrismaClient | null = null;
let pool: Pool | null = null;

export function createPrismaClient(): PrismaClient | null {
  const databaseUrl = env.databaseUrl || process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  pool = pool ?? new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient | null {
  if (env.persistenceMode === "json") return null;
  if (!env.databaseUrl) return null;

  if (!prismaClient) {
    prismaClient = createPrismaClient();
  }

  return prismaClient;
}

export async function closePrisma(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }

  if (pool) {
    await pool.end();
    pool = null;
  }
}

export const prisma = getPrisma() as any;
