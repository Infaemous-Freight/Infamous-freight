export type AvatarState = "idle" | "suggesting" | "alert" | "critical";

export interface CommandEntry {
  input: string;
  intent: string;
  avatarState: AvatarState;
  at?: number;
}

export interface GenesisSessionMemory {
  tenantId: string;
  userId?: string;
  lastSeenAt: number;
  avatarState: AvatarState;
  recentCommands: CommandEntry[];
  prefs: Record<string, unknown>;
}

export interface SessionStore {
  get(tenantId: string, userId?: string): Promise<GenesisSessionMemory>;
  set(mem: GenesisSessionMemory): Promise<void>;
  patch(
    tenantId: string,
    userId: string | undefined,
    patch: Partial<GenesisSessionMemory>,
  ): Promise<GenesisSessionMemory>;
  pushCommand(
    tenantId: string,
    userId: string | undefined,
    cmd: Omit<CommandEntry, "at">,
  ): Promise<GenesisSessionMemory>;
}
