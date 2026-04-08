const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { env } = require("../config/env");
const { recordQuery, DEFAULT_THRESHOLD } = require("../lib/queryMetrics.cjs");
const { attachSlowQueryLogger } = require("../lib/slowQueryLogger.cjs");

let prisma = null;
let pool = null;

function createPrismaClient() {
  const databaseUrl = env.databaseUrl || process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  pool = pool || new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getPrisma() {
  // Use fallback mode if no DATABASE_URL or PERSISTENCE_MODE is json
  if (env.persistenceMode === "json") return null;
  if (!env.databaseUrl) return null;

  if (!prisma) {
    const basePrisma = createPrismaClient();
    if (!basePrisma) return null;

    // Attach slow query logger (Prisma $on event)
    attachSlowQueryLogger(basePrisma);

    // Track query performance for admin analytics using Prisma Client Extensions (v7)
    if (typeof basePrisma.$extends === "function") {
      prisma = basePrisma.$extends({
        query: {
          $allModels: {
            async $allOperations({ model, operation, args, query }) {
              const start = Date.now();
              try {
                const result = await query(args);
                const duration = Date.now() - start;

                if (duration >= DEFAULT_THRESHOLD) {
                  console.warn(`Slow query detected: ${model}.${operation} took ${duration}ms`);
                }

                recordQuery({
                  model,
                  action: operation,
                  duration,
                  args,
                });

                return result;
              } catch (error) {
                recordQuery({
                  model,
                  action: operation,
                  duration: Date.now() - start,
                  args,
                  error,
                });
                throw error;
              }
            },
          },
        },
      });
    } else {
      prisma = basePrisma;
    }
  }
  return prisma;
}

async function closePrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }

  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPrisma,
  closePrisma,
  createPrismaClient,
  prisma: getPrisma(), // Legacy: return null or instance
};
