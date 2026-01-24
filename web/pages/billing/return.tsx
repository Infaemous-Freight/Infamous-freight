"use client";

import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error("Stripe publishable key is not configured");
}

const stripePromise = loadStripe(publishableKey);

export default function BillingReturnPage() {
  const [message, setMessage] = useState("Checking payment status...");

  useEffect(() => {
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      setMessage("Missing payment intent client secret.");
      return;
    }

    stripePromise
      .then((stripe) => stripe?.retrievePaymentIntent(clientSecret))
      .then((result) => {
        const status = result?.paymentIntent?.status;
        if (status === "succeeded") {
          setMessage("Subscription activated successfully.");
          return;
        }
        if (status === "processing") {
          setMessage("Payment processing. We will update your billing soon.");
          return;
        }
        if (status === "requires_payment_method") {
          setMessage("Payment failed. Please try another method.");
          return;
        }
        setMessage("Unable to determine payment status.");
      })
      .catch(() => setMessage("Unable to determine payment status."));
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Billing status</h1>
      <p style={{ opacity: 0.8 }}>{message}</p>
    </main>
  );
}
