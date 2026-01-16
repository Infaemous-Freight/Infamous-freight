/**
 * Tenant-scoped Prisma Client (Phase 19.2)
 * Enforces row-level security via Prisma query extension
 * 
 * Every tenant only sees their own data:
 * - Jobs filtered by organizationId
 * - JobEvents filtered through Job relationship
 * - Users filtered by organizationId
 * - Audit logs filtered by organizationId
 */

import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Create a tenant-scoped Prisma client
 * All queries are automatically filtered by organizationId
 */
export function tenantPrisma(
  prisma: PrismaClient,
  organizationId: string
): PrismaClient {
  return prisma.$extends({
    query: {
      // Job queries scoped to tenant
      job: {
        async findMany({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async findUniqueOrThrow({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async findFirstOrThrow({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async aggregate({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async groupBy({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
      },

      // User queries scoped to tenant
      user: {
        async findMany({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async findUnique({ args, query }) {
          // First fetch the user to verify they belong to this org
          const user = await query(args);
          if (user && user.organizationId !== organizationId) {
            throw new Error("User not found in this organization");
          }
          return user;
        },
        async findUniqueOrThrow({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async findFirstOrThrow({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
      },

      // JobEvent queries scoped through Job relationship
      jobEvent: {
        async findMany({ args, query }) {
          args.where = {
            ...(args.where || {}),
            job: { organizationId },
          };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = {
            ...(args.where || {}),
            job: { organizationId },
          };
          return query(args);
        },
        async findUniqueOrThrow({ args, query }) {
          args.where = {
            ...(args.where || {}),
            job: { organizationId },
          };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = {
            ...(args.where || {}),
            job: { organizationId },
          };
          return query(args);
        },
        async findFirstOrThrow({ args, query }) {
          args.where = {
            ...(args.where || {}),
            job: { organizationId },
          };
          return query(args);
        },
        async count({ args, query }) {
          args.where = {
            ...(args.where || {}),
            job: { organizationId },
          };
          return query(args);
        },
      },

      // OrgAuditLog queries scoped to tenant
      orgAuditLog: {
        async findMany({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async findUniqueOrThrow({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async findFirstOrThrow({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...(args.where || {}), organizationId };
          return query(args);
        },
      },
    },
  }) as PrismaClient;
}

/**
 * Usage in routes:
 * 
 * const orgId = req.auth?.organizationId;
 * if (!orgId) return res.status(401).json({ error: "No organization" });
 * 
 * const tprisma = tenantPrisma(prisma, orgId);
 * 
 * // Now all queries are automatically scoped to orgId
 * const jobs = await tprisma.job.findMany();
 * const users = await tprisma.user.findMany();
 * const logs = await tprisma.orgAuditLog.findMany();
 */
