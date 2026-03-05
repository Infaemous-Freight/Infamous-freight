const MAX = Number(process.env.AUDIT_MAX || 200);

// newest last
const events = [];

export function auditLog(entry) {
  const enriched = {
    ts: new Date().toISOString(),
    ...entry
  };

  events.push(enriched);
  if (events.length > MAX) events.splice(0, events.length - MAX);
  return enriched;
}

export function getAuditEvents({ limit = 50 } = {}) {
  const n = Math.max(1, Math.min(Number(limit) || 50, MAX));
  return events.slice(-n).reverse(); // newest first
}

export function getAuditStats() {
  const total = events.length;
  const errors = events.filter((e) => e.level === "error").length;

  const byEvent = {};
  const byAction = {};

  for (const e of events) {
    const ev = e.event || "unknown";
    byEvent[ev] = (byEvent[ev] || 0) + 1;

    const act = e.action || "unknown";
    byAction[act] = (byAction[act] || 0) + 1;
  }

  return { total, errors, byEvent, byAction, max: MAX };
}
