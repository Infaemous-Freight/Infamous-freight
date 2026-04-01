import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: 760, margin: "0 auto" }}>
      <h1>Subscription activated</h1>
      <p>Your payment was successful and billing is now active.</p>
      <p>
        <Link href="/settings/billing">Go to billing settings</Link>
      </p>
    </main>
  );
}
