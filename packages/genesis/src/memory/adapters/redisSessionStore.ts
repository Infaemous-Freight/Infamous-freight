import type { SessionStore, GenesisSessionMemory } from "../types";

export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttlSeconds?: number): Promise<unknown>;
}

function k(tenantId: string, userId?: string) {
  return `genesis:mem:${tenantId}:${userId ?? "anon"}`;
}

function safeParse<T>(s: string | null): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

export function createRedisSessionStore(
  redis: RedisLike,
  opts?: { ttlSeconds?: number; maxRecent?: number },
): SessionStore {
  const ttl = opts?.ttlSeconds ?? 60 * 60 * 24 * 7;
  const maxRecent = opts?.maxRecent ?? 25;

  return {
    async get(tenantId, userId) {
      const raw = await redis.get(k(tenantId, userId));
      const parsed = safeParse<GenesisSessionMemory>(raw);
      if (parsed) return parsed;

      const now = Date.now();
      const fresh: GenesisSessionMemory = {
        tenantId,
        userId,
        lastSeenAt: now,
        avatarState: "idle",
        recentCommands: [],
        prefs: {},
      };
      await redis.set(k(tenantId, userId), JSON.stringify(fresh), "EX", ttl);
      return fresh;
    },
    async set(mem) {
      await redis.set(k(mem.tenantId, mem.userId), JSON.stringify(mem), "EX", ttl);
    },
    async patch(tenantId, userId, patch) {
      const current = await this.get(tenantId, userId);
      const next: GenesisSessionMemory = {
        ...current,
        ...patch,
        prefs: { ...current.prefs, ...(patch.prefs ?? {}) },
        recentCommands: patch.recentCommands ?? current.recentCommands,
        lastSeenAt: Date.now(),
      };
      await this.set(next);
      return next;
    },
    async pushCommand(tenantId, userId, cmd) {
      const current = await this.get(tenantId, userId);
      const recent = [{ ...cmd, at: Date.now() }, ...current.recentCommands].slice(0, maxRecent);
      const next = { ...current, recentCommands: recent, lastSeenAt: Date.now() };
      await this.set(next);
      return next;
    },
  };
}
