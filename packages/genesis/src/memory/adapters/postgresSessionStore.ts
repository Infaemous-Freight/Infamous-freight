import type { SessionStore, GenesisSessionMemory } from "../types";

export interface PgClientLike {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

function key(tenantId: string, userId?: string) {
  return `${tenantId}::${userId ?? "anon"}`;
}

export function createPostgresSessionStore(pg: PgClientLike, opts?: { maxRecent?: number }): SessionStore {
  const maxRecent = opts?.maxRecent ?? 25;

  async function upsert(mem: GenesisSessionMemory) {
    await pg.query(
      `insert into genesis_sessions (k, tenant_id, user_id, payload, updated_at)
       values ($1,$2,$3,$4,now())
       on conflict (k) do update set payload=$4, updated_at=now()`,
      [key(mem.tenantId, mem.userId), mem.tenantId, mem.userId ?? null, JSON.stringify(mem)],
    );
  }

  return {
    async get(tenantId, userId) {
      const r = await pg.query<{ payload: unknown }>(
        `select payload from genesis_sessions where k=$1`,
        [key(tenantId, userId)],
      );
      const rawPayload = r.rows[0]?.payload;
      if (rawPayload != null) {
        let mem: GenesisSessionMemory | undefined;
        if (typeof rawPayload === "string") {
          try {
            mem = JSON.parse(rawPayload) as GenesisSessionMemory;
          } catch {
            // fall through to fresh session
          }
        } else if (typeof rawPayload === "object") {
          mem = rawPayload as GenesisSessionMemory;
        }
        if (mem) return mem;
      }

      const fresh: GenesisSessionMemory = {
        tenantId,
        userId,
        lastSeenAt: Date.now(),
        avatarState: "idle",
        recentCommands: [],
        prefs: {},
      };
      await upsert(fresh);
      return fresh;
    },
    async set(mem) {
      await upsert(mem);
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
      await upsert(next);
      return next;
    },
    async pushCommand(tenantId, userId, cmd) {
      const current = await this.get(tenantId, userId);
      const recent = [{ ...cmd, at: Date.now() }, ...current.recentCommands].slice(0, maxRecent);
      const next = { ...current, recentCommands: recent, lastSeenAt: Date.now() };
      await upsert(next);
      return next;
    },
  };
}
