export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const logs: AuditLogEntry[] = [];
let auditSequence = 0;

function nextAuditId(): string {
  auditSequence += 1;
  return `audit_${Date.now()}_${auditSequence}`;
}

export function recordAuditLog(entry: Omit<AuditLogEntry, "createdAt">): AuditLogEntry {
  const logEntry: AuditLogEntry = {
    ...entry,
    createdAt: new Date().toISOString(),
  };

  logs.push(logEntry);
  return logEntry;
}

export function listAuditLogs(): AuditLogEntry[] {
  return [...logs];
}

export function logAction(
  action: string,
  metadata: {
    eventId: string;
    userId: string;
    payload: unknown;
    [key: string]: unknown;
  },
): AuditLogEntry {
  return recordAuditLog({
    id: nextAuditId(),
    actor: metadata.userId,
    action,
    metadata,
  });
}
