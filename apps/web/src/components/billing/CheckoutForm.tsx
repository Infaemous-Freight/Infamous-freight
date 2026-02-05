"use client";

import * as React from "react";
import { AddressElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/billing/return` },
      redirect: "if_required",
    });

    if (error) setError(error.message ?? "Payment failed.");
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      <AddressElement options={{ mode: "billing" }} />
      <button
        disabled={!stripe || loading}
        className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
        type="submit"
      >
        {loading ? "Processing..." : "Pay & Activate"}
      </button>
      {error && <p className="text-sm text-white/80">{error}</p>}
    </form>
  );
}
