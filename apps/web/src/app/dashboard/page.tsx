import { AvatarDock } from "../../components/AvatarDock";
import { getDemoAuth } from "../../lib/auth";

export default async function Dashboard() {
  const { token, tenantId } = getDemoAuth();

  return (
    <main style={{ padding: 24 }}>
      <h2>Dashboard</h2>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <a href="/loadboard">Load Board</a>
        <a href="/shipments">Shipments</a>
      </div>

      <div style={{ marginTop: 18, padding: 16, border: "1px solid #333", borderRadius: 16 }}>
        <b>Load Board Quick Access</b>
        <p style={{ margin: 0, opacity: 0.85 }}>
          One tap to loads + AI recommendations (Genesis can open it too).
        </p>
        <div style={{ marginTop: 10 }}>
          <a href="/loadboard">Open Load Board →</a>
        </div>
      </div>

      <AvatarDock token={token} tenantId={tenantId} />
    </main>
  );
}
