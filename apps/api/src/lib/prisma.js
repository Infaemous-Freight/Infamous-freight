const { PrismaClient } = require("@prisma/client");

// Shared Prisma client instance for services
const prisma = new PrismaClient();

module.exports = prisma;
