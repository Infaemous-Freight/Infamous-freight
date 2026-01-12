/**
 * Stripe Payment Component
 * All payments route 100% to merchant account
 *
 * Usage:
 * <StripePaymentForm amount={99.99} description="Premium Feature" />
 */

"use client";

import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error("Stripe publishable key is not configured");
}
const stripePromise = loadStripe(publishableKey);

interface PaymentFormProps {
  amount: number;
  description?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Inner payment form component (must be inside Elements provider)
 */
function PaymentFormContent({
  amount,
  description,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe not loaded");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create payment intent on backend
      const response = await fetch("/api/billing/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          amount: amount.toString(),
          currency: "usd",
          description:
            description || "Payment from Infamous Freight Enterprises",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const { clientSecret } = await response.json();

      // Step 2: Confirm payment with Stripe
      // 100% goes to your Stripe account
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            // Optional: Add customer details
          },
        },
      });

      if (result.error) {
        setError(result.error.message || "Payment failed");
        onError?.(result.error.message || "Payment failed");
      } else if (result.paymentIntent.status === "succeeded") {
        setSuccess(true);
        onSuccess?.(result.paymentIntent.id);
        // Payment successful - 100% to your account
        console.log("✅ Payment succeeded! 100% to your Stripe account");
      } else {
        setError("Payment processing failed. Please try again.");
        onError?.("Payment processing failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-800">
          ✅ Payment successful! Thank you for your purchase.
        </p>
        <p className="text-sm text-green-600 mt-2">
          (100% of your payment goes to our account)
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-300 rounded p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#fa755a",
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-3 rounded text-sm">
        <p className="font-semibold">Amount: ${amount.toFixed(2)}</p>
        {description && <p className="text-gray-600">{description}</p>}
      </div>

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        💳 100% of your payment goes to our account
      </p>
    </form>
  );
}

/**
 * Main payment form wrapper with Stripe Elements provider
 */
export function StripePaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}

/**
 * Subscription Form Component
 * All recurring payments route 100% to merchant
 */
export function StripeSubscriptionForm({
  priceId,
  planName,
  onSuccess,
  onError,
}: {
  priceId: string;
  planName: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          priceId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription");
      }

      const { subscriptionId, status } = await response.json();

      if (status === "active") {
        setSuccess(true);
        onSuccess?.(subscriptionId);
        // Subscription successful - 100% to your account monthly
        console.log(
          "✅ Subscription active! 100% of recurring payments to your account",
        );
      } else {
        throw new Error("Subscription not activated");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-800">✅ Subscription activated! Thank you.</p>
        <p className="text-sm text-green-600 mt-2">
          (100% of your subscription goes to our account)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded">
        <p className="font-semibold text-lg">{planName}</p>
        <p className="text-gray-600 text-sm">
          Subscribe to start your recurring payments
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Setting up..." : `Subscribe to ${planName}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        💳 100% of your subscription goes to our account
      </p>
    </div>
  );
}

/**
 * Revenue Dashboard Component
 * Shows real-time revenue statistics
 */
export function RevenueStats() {
  const [revenue, setRevenue] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/billing/revenue", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        setRevenue(data.revenue);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load revenue:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!revenue) {
    return <div className="p-4">Failed to load revenue data</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <p className="text-gray-600 text-sm">One-Time Revenue</p>
        <p className="text-2xl font-bold text-blue-600">
          ${revenue.totalOneTime.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
      </div>

      <div className="bg-green-50 p-4 rounded border border-green-200">
        <p className="text-gray-600 text-sm">Transactions</p>
        <p className="text-2xl font-bold text-green-600">
          {revenue.totalTransactions}
        </p>
        <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
      </div>

      <div className="bg-purple-50 p-4 rounded border border-purple-200">
        <p className="text-gray-600 text-sm">Active Subscriptions</p>
        <p className="text-2xl font-bold text-purple-600">
          {revenue.activeSubscriptions}
        </p>
        <p className="text-xs text-gray-500 mt-2">Recurring revenue</p>
      </div>

      <div className="col-span-full bg-yellow-50 p-3 rounded border border-yellow-200">
        <p className="text-sm text-yellow-800">
          💰 <strong>100% of all revenue goes to your Stripe account.</strong>{" "}
          No fees applied by our platform.
        </p>
      </div>
    </div>
  );
}

export default StripePaymentForm;
