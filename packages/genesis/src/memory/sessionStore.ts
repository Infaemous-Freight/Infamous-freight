import type { GenesisSessionMemory, SessionStore } from "./types";

export function createSessionStore(maxRecent = 25): SessionStore {
  const db = new Map<string, GenesisSessionMemory>();
  const k = (tenantId: string, userId?: string) => `${tenantId}:${userId ?? "anon"}`;

  return {
    async get(tenantId, userId) {
      const key = k(tenantId, userId);
      const existing = db.get(key);
      if (existing) return existing;

      const fresh: GenesisSessionMemory = {
        tenantId,
        userId,
        lastSeenAt: Date.now(),
        avatarState: "idle",
        recentCommands: [],
        prefs: {},
      };
      db.set(key, fresh);
      return fresh;
    },
    async set(mem) {
      db.set(k(mem.tenantId, mem.userId), mem);
    },
    async patch(tenantId, userId, patch) {
      const cur = await this.get(tenantId, userId);
      const next = {
        ...cur,
        ...patch,
        prefs: { ...cur.prefs, ...(patch.prefs ?? {}) },
        recentCommands: patch.recentCommands ?? cur.recentCommands,
        lastSeenAt: Date.now(),
      };
      await this.set(next);
      return next;
    },
    async pushCommand(tenantId, userId, cmd) {
      const cur = await this.get(tenantId, userId);
      const recent = [{ ...cmd, at: Date.now() }, ...cur.recentCommands].slice(0, maxRecent);
      const next = { ...cur, recentCommands: recent, lastSeenAt: Date.now() };
      await this.set(next);
      return next;
    },
  };
}
