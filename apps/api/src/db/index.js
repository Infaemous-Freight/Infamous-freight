/**
 * Database module exports
 * Central export point for Prisma client and database utilities
 */

const { getPrisma, closePrisma, prisma } = require("./prisma");

module.exports = {
    getPrisma,
    closePrisma,
    prisma,
};
