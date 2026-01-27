const { PrismaClient } = require("@prisma/client");

// Centralized Prisma client for reuse across routes
const prisma = new PrismaClient();

module.exports = { prisma };
