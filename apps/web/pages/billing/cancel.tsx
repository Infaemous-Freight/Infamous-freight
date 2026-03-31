import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Checkout canceled</h1>
      <p>Your payment was not completed. You can retry any time.</p>
      <p>
        <Link href="/pricing">Return to Pricing</Link>
      </p>
    </main>
  );
}
