import type { GenesisAPI, GenesisInit, GenesisAvatarSnapshot } from "./types";
import { createGenesisContext } from "./context";
import { EventBus } from "../events/bus";
import { telemetry } from "../runtime/telemetry";
import { loadAvatar } from "../avatar/avatarLoader";
import { createAvatarStateMachine, transitionAvatar } from "../avatar/avatarStateMachine";
import { GenesisStore } from "../runtime/store";
import { isoNow } from "../utils/time";
import { createSessionStore } from "../memory/sessionStore";
import { defaultPolicy } from "../policy/defaultPolicy";
import { audit } from "../audit/audit";
import { worstAlert } from "../logistics/alerts";
import { routeCommand } from "../ai/commandRouter";

type InternalState = {
  avatarState: "idle" | "suggesting" | "alert" | "critical";
  avatarMessage?: string;
  avatarUpdatedAt: number;
};

export function createGenesis(init: GenesisInit): GenesisAPI {
  const ctx = createGenesisContext(init);
  const bus = new EventBus();
  const log = telemetry(ctx, bus);

  const role = init.role ?? "OPERATOR";
  const policy = init.policy ?? defaultPolicy;
  const sessions = init.sessionStore ?? createSessionStore(25);

  void sessions
    .patch(ctx.tenantId, ctx.userId, { lastSeenAt: ctx.now() })
    .catch((err) => log.error("Failed to patch session lastSeenAt on bootstrap", { err }));

  const avatar = loadAvatar({ id: "default" });
  const avatarSM = createAvatarStateMachine(avatar.defaultState);
  const store = new GenesisStore<InternalState>({
    avatarState: avatarSM.state,
    avatarMessage: avatarSM.message,
    avatarUpdatedAt: avatarSM.updatedAt,
  });

  bus.emit({ type: "genesis/boot", payload: { tenantId: ctx.tenantId, mode: ctx.mode } });
  log.info("Genesis booted", { tenantId: ctx.tenantId, mode: ctx.mode, role });

  function setAvatarState(state: InternalState["avatarState"], message?: string) {
    const now = ctx.now();
    const cur = store.get();
    const next = transitionAvatar(
      { state: cur.avatarState, message: cur.avatarMessage, updatedAt: cur.avatarUpdatedAt },
      state,
      message,
      now,
    );
    store.set({ avatarState: next.state, avatarMessage: next.message, avatarUpdatedAt: next.updatedAt });
    sessions.patch(ctx.tenantId, ctx.userId, { avatarState: next.state });
    bus.emit({ type: "avatar/state", payload: { state: next.state, message: next.message } });
  }

  function getAvatar(): GenesisAvatarSnapshot {
    const s = store.get();
    return { state: s.avatarState, message: s.avatarMessage, lastUpdatedAt: isoNow(s.avatarUpdatedAt) };
  }

  async function maybeAutoAlert() {
    if (!init.alerts?.getShipmentTelemetry) return;
    const telemetryRows = await init.alerts.getShipmentTelemetry();
    if (!telemetryRows?.length) return;
    const res = worstAlert(telemetryRows);
    if (res.severity === "CRITICAL") setAvatarState("critical", res.message);
    if (res.severity === "ALERT") setAvatarState("alert", res.message);
  }

  function command(req) {
    const input = req.input ?? "";
    const policyCtx = { tenantId: ctx.tenantId, userId: ctx.userId, role };
    try {
      const out = routeCommand({ role, policy, policyCtx }, req);
      setAvatarState(out.avatarState, out.message);
      sessions
        .pushCommand(ctx.tenantId, ctx.userId, {
          input,
          intent: String(out.action?.type ?? "NONE"),
          avatarState: out.avatarState,
        })
        .catch((err) => {
          // Best-effort: failures here should not break command handling
          console.error("Failed to persist session command history", err);
        });
      maybeAutoAlert().catch((err) => {
        // Best-effort: auto-alert failures are logged but do not affect the main command flow
        console.error("Failed to run auto-alert after command", err);
      });
      void audit(init.audit, {
        at: new Date(ctx.now()).toISOString(),
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        role,
        action: String(out.action?.type ?? "COMMAND"),
        ok: true,
        detail: { input },
      });
      bus.emit({ type: "ai/command", payload: { input, response: out } });
      return out;
    } catch (e: any) {
      void audit(init.audit, {
        at: new Date(ctx.now()).toISOString(),
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        role,
        action: "COMMAND",
        ok: false,
        detail: { input, error: String(e?.message ?? e) },
      });
      throw e;
    }
  }

  return { getAvatar, command, on: (event, handler) => bus.on(event, handler), setAvatarState };
}
