import Head from "next/head";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <>
        <Head>
          <title>Billing - Infamous Freight</title>
        </Head>
        <section style={{ padding: "3rem 1.5rem", maxWidth: 960, margin: "0 auto" }}>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.2em", color: "#5e647a" }}>
            Billing
          </p>
          <h1 style={{ margin: "0.5rem 0" }}>Company billing status</h1>
          <p style={{ color: "#5e647a", marginBottom: "2rem" }}>
            Billing is enforced before AI actions run.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              { label: "Status", value: "Active" },
              { label: "Plan", value: "Fleet" },
              { label: "Seats", value: "12" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "1.5rem",
                  borderRadius: 16,
                  border: "1px solid #e4e7f0",
                  background: "#ffffff",
                  boxShadow: "0 12px 32px rgba(17, 24, 39, 0.08)",
                }}
              >
                <h3 style={{ margin: 0 }}>{item.label}</h3>
                <p style={{ margin: "0.5rem 0 0", color: "#5e647a" }}>{item.value}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <Link href="/dashboard">← Back to dashboard</Link>
          </div>
        </section>
      </>
    </ProtectedRoute>
  );
}
