import type { AuditSink, AuditEvent } from "./types";

export const noopAudit: AuditSink = { write: () => {} };

export async function audit(sink: AuditSink | undefined, evt: AuditEvent) {
  const s = sink ?? noopAudit;
  await s.write(evt);
}
