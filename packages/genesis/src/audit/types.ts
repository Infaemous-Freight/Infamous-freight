export interface AuditEvent {
  at: string;
  tenantId: string;
  userId?: string;
  role?: string;
  action: string;
  ok: boolean;
  detail?: Record<string, unknown>;
}

export interface AuditSink {
  write(evt: AuditEvent): void | Promise<void>;
}
