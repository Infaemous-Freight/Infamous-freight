"use client";

import * as React from "react";
import { stripePromise } from "@/lib/stripe-web";

export default function BillingReturn() {
  const [status, setStatus] = React.useState<string>("Checking payment status...");

  React.useEffect(() => {
    (async () => {
      const stripe = await stripePromise;
      if (!stripe) return setStatus("Stripe not loaded.");

      const params = new URLSearchParams(window.location.search);
      const clientSecret = params.get("payment_intent_client_secret");
      if (!clientSecret) return setStatus("No payment intent found.");

      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
      setStatus(`Payment status: ${paymentIntent?.status ?? "unknown"}`);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-black">Billing Status</h1>
      <p className="mt-4 text-white/70">{status}</p>
    </div>
  );
}
