const { getPrisma } = require("../db/prisma");

const prisma = getPrisma();

if (prisma) {
  module.exports = prisma;
} else {
  module.exports = {
    $queryRaw: async () => {
      throw new Error("Database not configured");
    },
    $transaction: async () => {
      throw new Error("Database not configured");
    },
  };
}

// Allow ESM default imports from TypeScript route modules.
module.exports.default = module.exports;
