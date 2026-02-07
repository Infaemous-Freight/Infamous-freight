import Head from "next/head";
import Link from "next/link";
import { UsageMeter } from "@/components/UsageMeter";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function UsagePage() {
  return (
    <ProtectedRoute>
      <>
        <Head>
          <title>AI Usage - Infamous Freight</title>
        </Head>
        <section style={{ padding: "3rem 1.5rem", maxWidth: 960, margin: "0 auto" }}>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.2em", color: "#5e647a" }}>
            Usage
          </p>
          <h1 style={{ margin: "0.5rem 0" }}>AI usage governance</h1>
          <p style={{ color: "#5e647a", marginBottom: "2rem" }}>
            Actions are metered monthly and hard capped at 2x included usage.
          </p>
          <div
            style={{
              padding: "1.5rem",
              borderRadius: 16,
              border: "1px solid #e4e7f0",
              background: "#ffffff",
              boxShadow: "0 12px 32px rgba(17, 24, 39, 0.08)",
            }}
          >
            <UsageMeter used={320} included={500} />
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <Link href="/dashboard">← Back to dashboard</Link>
          </div>
        </section>
      </>
    </ProtectedRoute>
  );
}
