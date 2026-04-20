"use client";

export function StripeCustomerPortal() {
  return (
    <section style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Stripe Customer Portal</h3>
      <p>Manage plans, payment methods, and invoices via Stripe-hosted billing portal.</p>
      <button type="button">Open billing portal</button>
    </section>
  );
}
