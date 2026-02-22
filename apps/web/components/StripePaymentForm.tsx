/**
 * Stripe Payment Component
 * All payments route 100% to merchant account
 *
 * Usage:
 * <StripePaymentForm amount={99.99} description="Premium Feature" />
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  AddressElement,
  ExpressCheckoutElement,
  LinkAuthenticationElement,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "");
const billingBase = apiBase || "";

interface PaymentFormProps {
  amount: number;
  description?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

interface IntentResponse {
  clientSecret: string;
  paymentIntentId?: string;
}

interface SubscriptionResponse {
  clientSecret?: string;
  subscriptionId: string;
  status: string;
}

type ExpressCheckoutConfirmEvent = {
  complete?: (status: "success" | "fail") => void;
};

type RevenueStatsData = {
  totalOneTime: number;
  totalTransactions: number;
  activeSubscriptions: number;
};

/**
 * Inner payment form component (must be inside Elements provider)
 */
function PaymentFormContent({ amount, description, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const returnUrl = useMemo(() => window.location.href, []);

  const handleExpressConfirm = async (event: ExpressCheckoutConfirmEvent | undefined) => {
    if (!stripe || !elements) {
      return;
    }
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: "if_required",
    });

    if (result.error) {
      if (event && typeof event.complete === "function") {
        event.complete("fail");
      }
      setError(result.error.message || "Express checkout failed");
      onError?.(result.error.message || "Express checkout failed");
      return;
    }

    if (event && typeof event.complete === "function") {
      event.complete("success");
    }
    setSuccess(true);
    if (result.paymentIntent?.id) {
      onSuccess?.(result.paymentIntent.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe not loaded");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setError(result.error.message || "Payment failed");
        onError?.(result.error.message || "Payment failed");
      } else if (result.paymentIntent?.status === "succeeded") {
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
        <p className="text-green-800">✅ Payment successful! Thank you for your purchase.</p>
        <p className="text-sm text-green-600 mt-2">(100% of your payment goes to our account)</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* @ts-expect-error - Stripe type mismatch between library versions */}
      <ExpressCheckoutElement onConfirm={handleExpressConfirm} />

      <div className="border border-gray-300 rounded p-4 space-y-4">
        <LinkAuthenticationElement onChange={(event) => setEmail(event.value.email)} />
        <PaymentElement options={{ layout: "tabs" }} />
        <AddressElement options={{ mode: "billing" }} />
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
        {email ? ` • Receipt: ${email}` : ""}
      </p>
    </form>
  );
}

/**
 * Main payment form wrapper with Stripe Elements provider
 */
export function StripePaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  if (!stripePromise) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
        Stripe is not configured for this environment.
      </div>
    );
  }

  useEffect(() => {
    let mounted = true;

    async function createIntent() {
      try {
        const response = await fetch(`${billingBase}/api/billing/create-payment-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            amount: props.amount.toString(),
            currency: "usd",
            description: props.description || "Payment from Infamous Freight Enterprises",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create payment intent");
        }

        const data = (await response.json()) as IntentResponse;
        if (mounted) {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (mounted) {
          setInitError(message);
        }
        props.onError?.(message);
      }
    }

    createIntent();

    return () => {
      mounted = false;
    };
  }, [props.amount, props.description, props.onError]);

  if (initError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
        {initError}
      </div>
    );
  }

  if (!clientSecret) {
    return <div className="p-4">Loading payment details...</div>;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe",
    },
  } as const;

  return (
    <Elements stripe={stripePromise} options={options}>
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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${billingBase}/api/billing/create-subscription`, {
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

      const data = (await response.json()) as SubscriptionResponse;
      if (!data.clientSecret) {
        throw new Error("Subscription setup failed");
      }

      setClientSecret(data.clientSecret);
      setSubscriptionId(data.subscriptionId);
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

  if (clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: { theme: "stripe" },
        }}
      >
        <SubscriptionPaymentContent
          planName={planName}
          onSuccess={() => {
            setSuccess(true);
            if (subscriptionId) {
              onSuccess?.(subscriptionId);
            }

            console.log("✅ Subscription active! 100% of recurring payments to your account");
          }}
          onError={onError}
        />
      </Elements>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded">
        <p className="font-semibold text-lg">{planName}</p>
        <p className="text-gray-600 text-sm">Subscribe to start your recurring payments</p>
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

function SubscriptionPaymentContent({
  planName,
  onSuccess,
  onError,
}: {
  planName: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const returnUrl = useMemo(() => window.location.origin, []);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setError("Stripe not loaded");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: "if_required",
    });

    if (result.error) {
      const message = result.error.message || "Payment failed";
      setError(message);
      onError?.(message);
    } else if (result.paymentIntent?.status === "succeeded") {
      onSuccess?.(result.paymentIntent.id);
    } else {
      setError("Payment processing failed. Please try again.");
      onError?.("Payment processing failed");
    }
    setLoading(false);
  };

  const handleExpressConfirm = async (event: ExpressCheckoutConfirmEvent | undefined) => {
    if (!stripe || !elements) {
      return;
    }
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: "if_required",
    });

    if (result.error) {
      if (event && typeof event.complete === "function") {
        event.complete("fail");
      }
      const message = result.error.message || "Express checkout failed";
      setError(message);
      onError?.(message);
      return;
    }

    if (event && typeof event.complete === "function") {
      event.complete("success");
    }
    if (result.paymentIntent?.status === "succeeded" && result.paymentIntent.id) {
      onSuccess?.(result.paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleConfirm} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded">
        <p className="font-semibold text-lg">{planName}</p>
        <p className="text-gray-600 text-sm">Enter billing details to activate your subscription</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* @ts-expect-error - Stripe type mismatch between library versions */}
      <ExpressCheckoutElement onConfirm={handleExpressConfirm} />

      <div className="border border-gray-300 rounded p-4 space-y-4">
        <LinkAuthenticationElement onChange={(event) => setEmail(event.value.email)} />
        <PaymentElement options={{ layout: "tabs" }} />
        <AddressElement options={{ mode: "billing" }} />
      </div>

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : `Confirm ${planName}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        💳 100% of your subscription goes to our account
        {email ? ` • Receipt: ${email}` : ""}
      </p>
    </form>
  );
}

/**
 * Revenue Dashboard Component
 * Shows real-time revenue statistics
 */
export function RevenueStats() {
  const [revenue, setRevenue] = React.useState<RevenueStatsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${billingBase}/api/billing/revenue`, {
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
        <p className="text-2xl font-bold text-blue-600">${revenue.totalOneTime.toFixed(2)}</p>
        <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
      </div>

      <div className="bg-green-50 p-4 rounded border border-green-200">
        <p className="text-gray-600 text-sm">Transactions</p>
        <p className="text-2xl font-bold text-green-600">{revenue.totalTransactions}</p>
        <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
      </div>

      <div className="bg-purple-50 p-4 rounded border border-purple-200">
        <p className="text-gray-600 text-sm">Active Subscriptions</p>
        <p className="text-2xl font-bold text-purple-600">{revenue.activeSubscriptions}</p>
        <p className="text-xs text-gray-500 mt-2">Recurring revenue</p>
      </div>

      <div className="col-span-full bg-yellow-50 p-3 rounded border border-yellow-200">
        <p className="text-sm text-yellow-800">
          💰 <strong>100% of all revenue goes to your Stripe account.</strong> No fees applied by
          our platform.
        </p>
      </div>
    </div>
  );
}

export default StripePaymentForm;
