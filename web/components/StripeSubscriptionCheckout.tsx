"use client";

import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  AddressElement,
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error("Stripe publishable key is not configured");
}

const stripePromise = loadStripe(publishableKey);

type SubscriptionCheckoutProps = {
  clientSecret: string;
  returnUrl?: string;
  onSuccess?: () => void;
};

function SubscriptionCheckoutForm({
  returnUrl,
  onSuccess,
}: {
  returnUrl?: string;
  onSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe is still loading.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const resolvedReturnUrl =
      returnUrl ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/billing/return`
        : undefined);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: resolvedReturnUrl ? { return_url: resolvedReturnUrl } : {},
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed. Please try again.");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      setMessage("Subscription activated! 🎉");
      onSuccess?.();
    } else {
      setMessage("Payment processing. We will update your billing shortly.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <LinkAuthenticationElement />
      <PaymentElement />
      <AddressElement options={{ mode: "billing" }} />

      {error ? (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(180, 0, 0, 0.4)",
            background: "rgba(180, 0, 0, 0.08)",
            color: "rgb(180, 0, 0)",
          }}
        >
          {error}
        </div>
      ) : null}

      {message ? (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0, 140, 70, 0.4)",
            background: "rgba(0, 140, 70, 0.08)",
            color: "rgb(0, 140, 70)",
          }}
        >
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          padding: "12px 16px",
          borderRadius: 14,
          border: "1px solid rgba(255,0,0,0.45)",
          background: "rgba(255,0,0,0.12)",
          fontWeight: 600,
          cursor: !stripe || loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Processing..." : "Pay & Activate"}
      </button>
    </form>
  );
}

export default function StripeSubscriptionCheckout({
  clientSecret,
  returnUrl,
  onSuccess,
}: SubscriptionCheckoutProps) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SubscriptionCheckoutForm returnUrl={returnUrl} onSuccess={onSuccess} />
    </Elements>
  );
}
