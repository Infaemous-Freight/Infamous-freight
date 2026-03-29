/**
 * Tenant Audit Log Helpers (Phase 19.5)
 *
 * Separate from JobEvent (operational) and system audit chain.
 * OrgAuditLog is customer-visible, enterprise-grade audit trail.
 *
 * Every sensitive action is logged:
 * - Job acceptance
 * - Payment processing
 * - Data exports
 * - User permission changes
 * - Security events (failed auth, scope violations)
 */

import { PrismaClient } from "@prisma/client";

export interface AuditLogContext {
  organizationId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a customer-visible audit event
 *
 * Usage:
 *   await logAuditEvent(prisma, {
 *     organizationId: orgId,
 *     userId: req.auth.userId,
 *     action: "JOB_ACCEPTED",
 *     entity: "job",
 *     entityId: jobId,
 *     metadata: { driverId, wave: 2, estimatedMinutes: 45 },
 *   });
 */
export async function logAuditEvent(prisma: PrismaClient, context: AuditLogContext): Promise<void> {
  try {
    await prisma.orgAuditLog.create({
      data: {
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: context.action,
        entity: context.entity,
        entityId: context.entityId,
        metadata: context.metadata || {},
      },
    });
  } catch (error) {
    // Log audit failures but don't break the request
    console.error("Failed to log audit event", {
      context,
      error: (error as Error).message,
    });
  }
}

/**
 * Log multiple related events atomically
 * Useful for multi-step operations (e.g., payment + job acceptance)
 */
export async function logAuditEventsBatch(
  prisma: PrismaClient,
  contexts: AuditLogContext[],
): Promise<void> {
  try {
    await prisma.orgAuditLog.createMany({
      data: contexts.map((ctx) => ({
        organizationId: ctx.organizationId,
        actorUserId: ctx.userId,
        action: ctx.action,
        entity: ctx.entity,
        entityId: ctx.entityId,
        metadata: ctx.metadata || {},
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Failed to log audit event batch", {
      count: contexts.length,
      error: (error as Error).message,
    });
  }
}

/**
 * Retrieve audit log entries for a given organization
 * Supports filtering by action, entity, date range, actor
 */
export async function getAuditLogs(
  prisma: PrismaClient,
  organizationId: string,
  filters?: {
    action?: string;
    entity?: string;
    userId?: string;
    entityId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  },
) {
  const limit = Math.min(filters?.limit || 100, 1000); // Max 1000 per page
  const offset = filters?.offset || 0;

  const where: any = {
    organizationId,
  };

  if (filters?.action) where.action = filters.action;
  if (filters?.entity) where.entity = filters.entity;
  if (filters?.userId) where.actorUserId = filters.userId;
  if (filters?.entityId) where.entityId = filters.entityId;

  if (filters?.from || filters?.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }

  const [logs, total] = await Promise.all([
    prisma.orgAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.orgAuditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Audit action constants (recommended pattern)
 * Use these instead of string literals for consistency
 */
export const AUDIT_ACTIONS = {
  // Job lifecycle
  JOB_CREATED: "JOB_CREATED",
  JOB_OPENED: "JOB_OPENED",
  JOB_ACCEPTED: "JOB_ACCEPTED",
  JOB_REJECTED: "JOB_REJECTED",
  JOB_PICKED_UP: "JOB_PICKED_UP",
  JOB_DELIVERED: "JOB_DELIVERED",
  JOB_COMPLETED: "JOB_COMPLETED",
  JOB_CANCELED: "JOB_CANCELED",

  // Payment
  PAYMENT_INITIATED: "PAYMENT_INITIATED",
  PAYMENT_SUCCEEDED: "PAYMENT_SUCCEEDED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_REFUNDED: "PAYMENT_REFUNDED",

  // User / Account
  USER_INVITED: "USER_INVITED",
  USER_JOINED: "USER_JOINED",
  USER_PERMISSIONS_CHANGED: "USER_PERMISSIONS_CHANGED",
  USER_DEACTIVATED: "USER_DEACTIVATED",

  // Data exports
  AUDIT_EXPORTED: "AUDIT_EXPORTED",
  DATA_EXPORTED: "DATA_EXPORTED",

  // Security events
  AUTH_FAILED: "AUTH_FAILED",
  SCOPE_VIOLATION: "SCOPE_VIOLATION",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",

  // Administrative
  ORG_SETTINGS_UPDATED: "ORG_SETTINGS_UPDATED",
  API_KEY_CREATED: "API_KEY_CREATED",
  API_KEY_REVOKED: "API_KEY_REVOKED",

  // Billing
  BILLING_INVOICE_GENERATED: "BILLING_INVOICE_GENERATED",
  BILLING_INVOICE_SENT: "BILLING_INVOICE_SENT",
} as const;

/**
 * Audit entity constants
 */
export const AUDIT_ENTITIES = {
  JOB: "job",
  PAYMENT: "payment",
  USER: "user",
  ORGANIZATION: "organization",
  API_KEY: "api_key",
  INTEGRATION: "integration",
} as const;

/**
 * Helper to create rich audit metadata
 */
export function createAuditMetadata(
  details: Record<string, any>,
  userAgent?: string,
  ipAddress?: string,
): Record<string, any> {
  return {
    ...details,
    userAgent,
    ipAddress,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Export audit logs to CSV format (for customer delivery)
 */
export function auditLogsToCSV(
  logs: Array<{
    id: string;
    createdAt: Date;
    actorUserId: string | null;
    action: string;
    entity: string;
    entityId: string | null;
    metadata: any;
  }>,
): string {
  const headers = ["Timestamp", "Actor", "Action", "Entity", "EntityId", "Details"];

  const rows = logs.map((log) => [
    log.createdAt.toISOString(),
    log.actorUserId || "SYSTEM",
    log.action,
    log.entity,
    log.entityId || "",
    JSON.stringify(log.metadata || {}),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) =>
          typeof cell === "string" && cell.includes(",") ? `"${cell.replace(/"/g, '""')}"` : cell,
        )
        .join(","),
    ),
  ].join("\n");

  return csvContent;
}

/**
 * Type-safe audit logging with middleware integration
 *
 * Usage in route:
 *   router.post("/jobs/:id/accept", authenticate, async (req, res, next) => {
 *     try {
 *       const job = await service.acceptJob(jobId);
 *
 *       await auditLog(prisma, {
 *         organizationId: req.auth.organizationId,
 *         userId: req.auth.userId,
 *         action: AUDIT_ACTIONS.JOB_ACCEPTED,
 *         entity: AUDIT_ENTITIES.JOB,
 *         entityId: jobId,
 *         metadata: createAuditMetadata({
 *           driverId: job.driverId,
 *           wave: job.offerWave,
 *         }, req.get("user-agent"), req.ip),
 *       });
 *
 *       res.json(job);
 *     } catch (err) {
 *       next(err);
 *     }
 *   });
 */
