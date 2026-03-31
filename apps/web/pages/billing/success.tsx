import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Subscription active</h1>
      <p>Your payment was confirmed and your subscription is now active.</p>
      <p>
        <Link href="/settings/billing">Go to Billing Settings</Link>
      </p>
    </main>
  );
}
