import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "48px 24px", maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12 }}>
        Infamous Freight Enterprises
      </h1>
      <p style={{ fontSize: 18, opacity: 0.75, marginBottom: 32 }}>
        AI-powered freight and logistics automation platform.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link
          href="/dashboard"
          style={{
            padding: "12px 24px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Go to Dashboard
        </Link>
        <Link
          href="/auth/sign-in"
          style={{
            padding: "12px 24px",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
