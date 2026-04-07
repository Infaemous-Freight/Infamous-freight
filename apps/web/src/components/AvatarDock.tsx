"use client";

import { useState } from "react";
import type { AICommandResponse, AvatarState } from "@infamous-freight/shared";
import { apiPost } from "../lib/api";

export function AvatarDock({ token, tenantId }: { token: string; tenantId: string }) {
  const [state, setState] = useState<AvatarState>("idle");
  const [msg, setMsg] = useState<string>("");

  async function run(cmd: string) {
    const res = await apiPost<AICommandResponse>("/ai/command", token, { tenantId, input: cmd });
    setState(res.avatarState);
    setMsg(res.message);

    if (res.action?.type === "NAVIGATE") {
      const to = res.action.payload?.to;
      if (to === "loadboard") window.location.assign("/loadboard");
      if (to === "routes") window.location.assign("/dashboard");
      if (to === "shipments") window.location.assign("/shipments");
    }
  }

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, width: 320 }}>
      <div style={{ padding: 12, borderRadius: 16, border: "1px solid #333" }}>
        <div style={{ fontWeight: 700 }}>Genesis Avatar</div>
        <div style={{ opacity: 0.8, marginTop: 6 }}>state: {state}</div>
        {msg ? <div style={{ marginTop: 8 }}>{msg}</div> : null}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => run("recommend best loads")} style={{ padding: 8 }}>
            Best Loads
          </button>
          <button onClick={() => run("track shipment")} style={{ padding: 8 }}>
            Track
          </button>
          <button onClick={() => run("optimize route")} style={{ padding: 8 }}>
            Optimize
          </button>
        </div>
      </div>
    </div>
  );
}
