export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const logs: AuditLogEntry[] = [];

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
