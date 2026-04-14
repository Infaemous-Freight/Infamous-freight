import type { Load } from "@infamous-freight/shared";
import { apiGet, apiPost } from "../../lib/api";
import { getDemoAuth } from "../../lib/auth";
import { LoadBoardTable } from "../../components/LoadBoardTable";

export const metadata = { title: "Load Board" };

export default async function LoadBoard() {
  const { token } = getDemoAuth();
  let loads: Load[] = [];
  let error: string | null = null;

  try {
    const res = await apiGet<{ ok: boolean; data: Load[] }>("/loadboard", token);
    loads = res.data;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load board";
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Load Board</h2>
          <p style={{ opacity: 0.65, margin: "4px 0 0" }}>Browse and claim available loads.</p>
        </div>
      </div>
      {error ? (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      ) : (
        <LoadBoardTable loads={loads} />
      )}
    </main>
  );
}
