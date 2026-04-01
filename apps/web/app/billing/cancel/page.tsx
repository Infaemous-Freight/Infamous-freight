import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: 760, margin: "0 auto" }}>
      <h1>Checkout canceled</h1>
      <p>No charge was made. You can restart checkout whenever you are ready.</p>
      <p>
        <Link href="/pricing">Return to pricing</Link>
      </p>
    </main>
  );
}
