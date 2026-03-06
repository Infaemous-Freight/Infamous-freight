import type { SessionStore } from "../memory/types";
import type { GenesisPolicy, Role } from "../policy/types";
import type { AuditSink } from "../audit/types";
import type { AlertsDeps } from "../logistics/types";
import type { AICommandResponse, GenesisCommandInput } from "../ai/commandRouter";

export interface GenesisInit {
  mode: "server" | "web" | "mobile";
  tenantId: string;
  userId?: string;
  role?: Role;
  sessionStore?: SessionStore;
  policy?: GenesisPolicy;
  audit?: AuditSink;
  alerts?: AlertsDeps;
  now?: () => number;
  logger?: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
  };
}

export interface GenesisAvatarSnapshot {
  state: "idle" | "suggesting" | "alert" | "critical";
  message?: string;
  lastUpdatedAt: string;
}

export interface GenesisAPI {
  getAvatar(): GenesisAvatarSnapshot;
  command(req: GenesisCommandInput): AICommandResponse;
  on(event: string, handler: (payload: unknown) => void): () => void;
  setAvatarState(state: "idle" | "suggesting" | "alert" | "critical", message?: string): void;
}
