import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// Prisma runtime requires an adapter with engineType=client, while generated
// typings expose a zero-arg constructor. Cast is used to bridge that mismatch.
export const prisma = new (PrismaClient as any)({ adapter });

export async function closePrisma(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}
