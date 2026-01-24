const { PrismaClient } = require("@prisma/client");
const { env } = require("../config/env");
const { recordQuery, DEFAULT_THRESHOLD } = require("../lib/queryMetrics");
const { attachSlowQueryLogger } = require("../lib/slowQueryLogger");
const { logger } = require("../middleware/logger");

let prisma = null;

function getPrisma() {
  // Use fallback mode if no DATABASE_URL or PERSISTENCE_MODE is json
  if (env.persistenceMode === "json") return null;
  if (!env.databaseUrl) return null;

  if (!prisma) {
    prisma = new PrismaClient();

    // Attach slow query logger (Prisma $on event)
    attachSlowQueryLogger(prisma);

    // Track query performance for admin analytics
    prisma.$use(async (params, next) => {
      const start = Date.now();
      try {
        const result = await next(params);
        const duration = Date.now() - start;

        if (duration >= DEFAULT_THRESHOLD) {
          logger.warn({
            model: params.model,
            action: params.action,
            duration_ms: duration,
            threshold: DEFAULT_THRESHOLD
          }, 'Slow query detected');
        }

        recordQuery({
          model: params.model,
          action: params.action,
          duration,
          args: params.args,
        });

        return result;
      } catch (error) {
        recordQuery({
          model: params.model,
          action: params.action,
          duration: Date.now() - start,
          args: params.args,
          error,
        });
        throw error;
      }
    });
  }
  return prisma;
}

async function closePrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = {
  getPrisma,
  closePrisma,
  prisma: getPrisma(), // Legacy: return null or instance
};
