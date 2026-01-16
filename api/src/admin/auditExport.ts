/**
 * Audit Export (Phase 19.6)
 * 
 * Enterprise-grade audit log export for:
 * - SOC2 compliance verification
 * - Customer data retention periods
 * - Security incident investigation
 * - Regulatory compliance
 * 
 * Supports multiple export formats:
 * - JSON (structured, searchable)
 * - CSV (Excel/spreadsheet compatible)
 * - JSONL (streaming large exports)
 */

import { PrismaClient } from "@prisma/client";
import { createWriteStream, promises as fsPromises } from "fs";
import path from "path";
import { Readable } from "stream";

export interface ExportOptions {
  format: "json" | "csv" | "jsonl"; // Default: json
  includeMetadata?: boolean; // Include full metadata objects
  compress?: boolean; // gzip compression
  pretty?: boolean; // Formatted JSON (for human review)
}

export interface ExportResult {
  fileName: string;
  filePath: string;
  format: string;
  recordCount: number;
  sizeBytes: number;
  createdAt: Date;
  url?: string; // Pre-signed URL if uploaded to cloud storage
}

/**
 * Export organization audit logs for a given period
 * 
 * Usage:
 *   const result = await exportOrgAudit(prisma, {
 *     organizationId: "org_123",
 *     from: new Date("2026-01-01"),
 *     to: new Date("2026-01-31"),
 *     format: "json",
 *   });
 *   // result.filePath = "/tmp/audit_export_org_123_2026-01.json"
 */
export async function exportOrgAudit(
  prisma: PrismaClient,
  options: {
    organizationId: string;
    from: Date;
    to: Date;
    format?: "json" | "csv" | "jsonl";
    includeMetadata?: boolean;
    outputDir?: string; // Default: /tmp
  }
): Promise<ExportResult> {
  const {
    organizationId,
    from,
    to,
    format = "json",
    includeMetadata = true,
    outputDir = "/tmp",
  } = options;

  // Query audit logs for the period
  const logs = await prisma.orgAuditLog.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: from,
        lte: to,
      },
    },
    orderBy: { createdAt: "asc" },
    take: 100000, // Reasonable limit; use streaming for larger exports
  });

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `audit_export_${organizationId}_${timestamp}.${format}`;
  const filePath = path.join(outputDir, fileName);

  // Export based on format
  let content: string;
  let sizeBytes: number;

  if (format === "json") {
    content = JSON.stringify(
      {
        export: {
          organizationId,
          exportedAt: new Date().toISOString(),
          period: { from: from.toISOString(), to: to.toISOString() },
          recordCount: logs.length,
        },
        logs: logs.map((log) => sanitizeLogForExport(log, includeMetadata)),
      },
      null,
      2 // Pretty print
    );
  } else if (format === "csv") {
    content = logsToCSV(logs);
  } else if (format === "jsonl") {
    content = logs
      .map((log) => JSON.stringify(sanitizeLogForExport(log, includeMetadata)))
      .join("\n");
  } else {
    throw new Error(`Unsupported export format: ${format}`);
  }

  // Write to file
  sizeBytes = Buffer.byteLength(content, "utf-8");
  await fsPromises.writeFile(filePath, content, "utf-8");

  return {
    fileName,
    filePath,
    format,
    recordCount: logs.length,
    sizeBytes,
    createdAt: new Date(),
  };
}

/**
 * Stream large audit log exports without loading entire dataset in memory
 * 
 * Usage:
 *   const stream = await streamOrgAudit(prisma, {
 *     organizationId: "org_123",
 *     from: startDate,
 *     to: endDate,
 *     format: "jsonl",
 *   });
 *   stream.pipe(response);
 */
export async function streamOrgAudit(
  prisma: PrismaClient,
  options: {
    organizationId: string;
    from: Date;
    to: Date;
    format?: "json" | "jsonl";
    batchSize?: number; // Default: 1000
  }
): Promise<Readable> {
  const {
    organizationId,
    from,
    to,
    format = "jsonl",
    batchSize = 1000,
  } = options;

  const where = {
    organizationId,
    createdAt: { gte: from, lte: to },
  };

  // Create readable stream
  let isFirstBatch = true;
  let offset = 0;

  return Readable.from(
    (async function* generator() {
      if (format === "json") {
        yield JSON.stringify({
          export: {
            organizationId,
            exportedAt: new Date().toISOString(),
            period: { from: from.toISOString(), to: to.toISOString() },
          },
          logs: [
        });
      }

      // Stream in batches
      while (true) {
        const batch = await prisma.orgAuditLog.findMany({
          where,
          orderBy: { createdAt: "asc" },
          skip: offset,
          take: batchSize,
        });

        if (batch.length === 0) break;

        for (const log of batch) {
          if (!isFirstBatch && format === "json") {
            yield ",";
          }
          isFirstBatch = false;

          const sanitized = sanitizeLogForExport(log, true);
          if (format === "json") {
            yield JSON.stringify(sanitized);
          } else {
            yield JSON.stringify(sanitized) + "\n";
          }
        }

        offset += batchSize;
      }

      if (format === "json") {
        yield "]}\n";
      }
    })()
  );
}

/**
 * Export audit logs for a specific date range with filtering
 * (Customer-facing endpoint)
 */
export async function exportFilteredAudit(
  prisma: PrismaClient,
  organizationId: string,
  filters: {
    from: Date;
    to: Date;
    action?: string;
    entity?: string;
    userId?: string;
    format?: "json" | "csv" | "jsonl";
    maxRecords?: number;
  }
): Promise<ExportResult> {
  const {
    from,
    to,
    action,
    entity,
    userId,
    format = "json",
    maxRecords = 10000,
  } = filters;

  const where: any = {
    organizationId,
    createdAt: { gte: from, lte: to },
  };

  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (userId) where.actorUserId = userId;

  const logs = await prisma.orgAuditLog.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: maxRecords,
  });

  let content: string;
  if (format === "csv") {
    content = logsToCSV(logs);
  } else if (format === "jsonl") {
    content = logs.map((log) => JSON.stringify(log)).join("\n");
  } else {
    content = JSON.stringify(logs, null, 2);
  }

  const fileName = `audit_filtered_${organizationId}_${Date.now()}.${format}`;
  const filePath = path.join("/tmp", fileName);
  const sizeBytes = Buffer.byteLength(content, "utf-8");

  await fsPromises.writeFile(filePath, content, "utf-8");

  return {
    fileName,
    filePath,
    format,
    recordCount: logs.length,
    sizeBytes,
    createdAt: new Date(),
  };
}

/**
 * Sanitize audit log for external export
 * Removes sensitive data, redacts PII
 */
function sanitizeLogForExport(
  log: any,
  includeMetadata: boolean = true
): any {
  return {
    timestamp: log.createdAt,
    actor: log.actorUserId ? { id: log.actorUserId } : null,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    ...(includeMetadata && log.metadata
      ? { details: redactSensitiveData(log.metadata) }
      : {}),
  };
}

/**
 * Redact sensitive information from metadata
 * Prevents accidental exposure of PII in audit logs
 */
function redactSensitiveData(metadata: any): any {
  if (!metadata || typeof metadata !== "object") {
    return metadata;
  }

  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "ssn",
    "creditCard",
    "bankAccount",
    "apiKey",
    "privateKey",
  ];

  const redacted = { ...metadata };

  for (const key of Object.keys(redacted)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      redacted[key] = "***REDACTED***";
    }
  }

  return redacted;
}

/**
 * Convert audit logs to CSV format
 */
function logsToCSV(
  logs: Array<{
    createdAt: Date;
    actorUserId: string | null;
    action: string;
    entity: string;
    entityId: string | null;
    metadata: any;
  }>
): string {
  const headers = [
    "Timestamp",
    "Actor",
    "Action",
    "Entity",
    "EntityId",
    "Details",
  ];

  const rows = logs.map((log) => [
    log.createdAt.toISOString(),
    log.actorUserId || "SYSTEM",
    log.action,
    log.entity,
    log.entityId || "",
    JSON.stringify(redactSensitiveData(log.metadata || {})),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) =>
          typeof cell === "string" && cell.includes(",")
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        )
        .join(",")
    ),
  ].join("\n");

  return csv;
}

/**
 * Generate DPA (Data Processing Agreement) compliance report
 * Shows audit trail for data handling
 */
export async function generateDPAReport(
  prisma: PrismaClient,
  organizationId: string,
  from: Date,
  to: Date
): Promise<{
  summary: {
    organizationId: string;
    period: { from: Date; to: Date };
    totalEvents: number;
    dataAccessEvents: number;
    dataExportEvents: number;
    deletionEvents: number;
    lastEvent: Date | null;
  };
  timeline: Array<{
    date: string;
    eventCount: number;
    actions: string[];
  }>;
}> {
  const logs = await prisma.orgAuditLog.findMany({
    where: {
      organizationId,
      createdAt: { gte: from, lte: to },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by date and action
  const grouped = new Map<string, Set<string>>();
  for (const log of logs) {
    const date = log.createdAt.toISOString().split("T")[0];
    if (!grouped.has(date)) {
      grouped.set(date, new Set());
    }
    grouped.get(date)!.add(log.action);
  }

  // Count event types
  const counts = {
    data: 0,
    export: 0,
    delete: 0,
  };

  for (const log of logs) {
    if (log.action.includes("DATA")) counts.data++;
    if (log.action.includes("EXPORT")) counts.export++;
    if (log.action.includes("DELETE")) counts.delete++;
  }

  return {
    summary: {
      organizationId,
      period: { from, to },
      totalEvents: logs.length,
      dataAccessEvents: counts.data,
      dataExportEvents: counts.export,
      deletionEvents: counts.delete,
      lastEvent: logs[logs.length - 1]?.createdAt || null,
    },
    timeline: Array.from(grouped.entries())
      .map(([date, actions]) => ({
        date,
        eventCount: logs.filter((l) => l.createdAt.toISOString().startsWith(date))
          .length,
        actions: Array.from(actions),
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}
