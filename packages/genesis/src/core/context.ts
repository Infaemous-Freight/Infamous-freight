import type { GenesisInit } from "./types";

export function createGenesisContext(init: GenesisInit) {
  return {
    tenantId: init.tenantId,
    userId: init.userId,
    mode: init.mode,
    now: init.now ?? Date.now,
  };
}
