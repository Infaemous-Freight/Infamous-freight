import Link from "next/link";

export default function ConnectRefresh(): React.ReactElement {
  return (
    <div className="page">
      <section className="section">
        <div className="container" style={{ maxWidth: 620 }}>
          <div className="card">
            <h1 className="section-title" style={{ marginTop: 0 }}>
              Stripe Connect
            </h1>
            <p style={{ color: "var(--muted-400)" }}>
              The onboarding session expired or was interrupted. Start again.
            </p>
            <Link href="/connect" className="btn btn-primary">
              Restart Connect
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
