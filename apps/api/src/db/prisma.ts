import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { env } from "../config/env.js";

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);

export const prisma = new (PrismaClient as any)({ adapter }) as PrismaClient;

export async function closePrisma(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}
