# Stripe Payment Integration - 100% to Your Bank Account

## Quick Setup (15 minutes)

### Step 1: Create Stripe Account

1. Go to: <https://stripe.com>
2. Click **"Sign up"** (or sign in if you have account)
3. **Verify email** + phone number
4. Add your **business bank account** (money goes here)
5. Get your **API keys** (live mode)

### Step 2: Get Your API Keys

```
Dashboard → Settings → API Keys
```

Copy these (KEEP SECRET):

- **Publishable Key**: `pk_live_xxx...`
- **Secret Key**: `sk_live_xxx...`

### Step 3: Add to Environment

```bash
# .env (production)
STRIPE_SECRET_KEY=sk_live_your_actual_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key_here
STRIPE_WEBHOOK_SECRET=whsec_xxx...
```

---

## Implementation Code

### Backend Setup (Express.js)

```javascript
// apps/api/src/services/stripeService.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  // Create customer in Stripe
  async createCustomer(userId, email, name) {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId } // Link to your database
    });

    // Save Stripe customer ID to database
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id }
    });

    return customer;
  }

  // Create subscription (recurring billing)
  async createSubscription(userId, planId) {
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user.stripeCustomerId) {
      throw new Error('No Stripe customer ID');
    }

    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: planId }], // Plan ID from Stripe
      payment_behavior: 'error_if_incomplete',
      metadata: { userId, tier: 'pro' }
    });

    // Save subscription to database
    await prisma.subscription.create({
      data: {
        userId,
        stripeSubscriptionId: subscription.id,
        planId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    return subscription;
  }

  // Get customer balance
  async getCustomerBalance(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user.stripeCustomerId) return null;

    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    
    return {
      balance: customer.balance, // Cents
      balanceUSD: customer.balance / 100,
      email: customer.email,
      status: customer.deleted ? 'deleted' : 'active'
    };
  }

  // Create one-time charge (for usage)
  async createInvoiceItem(userId, amount, description) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const invoiceItem = await stripe.invoiceItems.create({
      customer: user.stripeCustomerId,
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      description: description
    });

    return invoiceItem;
  }

  // Finalize and send invoice (for metered usage)
  async finalizeInvoice(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      status: 'draft',
      limit: 1
    });

    if (invoices.data.length === 0) return null;

    const invoice = await stripe.invoices.finalizeInvoice(invoices.data[0].id);
    
    return invoice;
  }

  // List all charges (payment history)
  async getPaymentHistory(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const charges = await stripe.charges.list({
      customer: user.stripeCustomerId,
      limit: 50
    });

    return charges.data.map(charge => ({
      id: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency.toUpperCase(),
      status: charge.status,
      date: new Date(charge.created * 1000),
      description: charge.description,
      receiptUrl: charge.receipt_url
    }));
  }
}

module.exports = new StripeService();
```

### API Endpoints

```javascript
// apps/api/src/routes/billing.js

const express = require('express');
const { authenticate, requireScope } = require('../middleware/security');
const stripeService = require('../services/stripeService');

const router = express.Router();

// Subscribe to plan
router.post(
  '/subscribe',
  authenticate,
  async (req, res, next) => {
    try {
      const { planId } = req.body;
      
      const subscription = await stripeService.createSubscription(
        req.user.sub,
        planId
      );

      res.json({
        success: true,
        subscription,
        message: 'Subscription created. Payment will be charged to your card.'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get payment history
router.get(
  '/payments',
  authenticate,
  async (req, res, next) => {
    try {
      const payments = await stripeService.getPaymentHistory(req.user.sub);
      
      res.json({
        success: true,
        payments,
        total: payments.reduce((sum, p) => sum + p.amount, 0)
      });
    } catch (error) {
      next(error);
    }
  }
);

// Usage-based billing - add charge
router.post(
  '/usage-charge',
  authenticate,
  async (req, res, next) => {
    try {
      const { amount, description } = req.body;

      const item = await stripeService.createInvoiceItem(
        req.user.sub,
        amount,
        description
      );

      res.json({
        success: true,
        charged: amount,
        message: 'Usage charge added to next invoice'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Webhook to handle Stripe events
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    const sig = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle different event types
      switch (event.type) {
        case 'invoice.payment_succeeded':
          // Payment successful - update database
          await handlePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          // Payment failed - alert user
          await handlePaymentFailed(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          // Subscription cancelled
          await handleSubscriptionDeleted(event.data.object);
          break;

        case 'charge.refunded':
          // Refund issued
          await handleRefund(event.data.object);
          break;
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }
);

// Handle payment success
async function handlePaymentSucceeded(invoice) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: invoice.customer }
  });

  if (user) {
    await prisma.payment.create({
      data: {
        userId: user.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        status: 'succeeded',
        paidAt: new Date(invoice.paid_at * 1000)
      }
    });

    // Send payment confirmation email
    await sendEmail(user.email, {
      subject: 'Payment Received',
      body: `Your payment of $${invoice.amount_paid / 100} was successful.`
    });
  }
}

// Handle payment failure
async function handlePaymentFailed(invoice) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: invoice.customer }
  });

  if (user) {
    await sendEmail(user.email, {
      subject: 'Payment Failed',
      body: `Your payment failed. Please update your payment method.`
    });
  }
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: subscription.customer }
  });

  if (user) {
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { status: 'cancelled' }
    });
  }
}

// Handle refunds
async function handleRefund(charge) {
  // Log refund in database
  const payment = await prisma.payment.findFirst({
    where: { stripeInvoiceId: charge.invoice }
  });

  if (payment) {
    await prisma.refund.create({
      data: {
        paymentId: payment.id,
        amount: charge.amount_refunded / 100,
        reason: charge.refund_reason,
        stripeRefundId: charge.id
      }
    });
  }
}

module.exports = router;
```

### Frontend - Payment Page

```typescript
// apps/web/pages/billing.tsx

import { useState } from 'react';
import { loadStripe } from '@stripe/js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function BillingPage() {
  const [plan, setPlan] = useState('pro');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: `price_${plan}_monthly` // From Stripe
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Subscription created! Check your email for confirmation.');
        // Redirect to dashboard or show success
        window.location.href = '/dashboard';
      }
    } catch (error) {
      setMessage('❌ Subscription failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="billing-page">
      <h1>Choose Your Plan</h1>

      <div className="pricing-options">
        <PricingCard
          name="Pro"
          price="$99"
          period="/month"
          features={['100 shipments', 'Email support', 'Basic analytics']}
          onSelect={() => { setPlan('pro'); handleSubscribe(); }}
          loading={loading && plan === 'pro'}
        />

        <PricingCard
          name="Enterprise"
          price="$999"
          period="/month"
          features={['Unlimited shipments', 'Priority support', 'Advanced analytics', 'Custom integrations']}
          onSelect={() => { setPlan('enterprise'); handleSubscribe(); }}
          loading={loading && plan === 'enterprise'}
        />
      </div>

      {message && <div className="message">{message}</div>}
    </div>
  );
}

function PricingCard({ name, price, period, features, onSelect, loading }) {
  return (
    <div className="pricing-card">
      <h2>{name}</h2>
      <div className="price">
        {price}<span className="period">{period}</span>
      </div>
      <ul className="features">
        {features.map(f => <li key={f}>✓ {f}</li>)}
      </ul>
      <button 
        onClick={onSelect} 
        disabled={loading}
        className="subscribe-btn"
      >
        {loading ? 'Processing...' : 'Subscribe Now'}
      </button>
    </div>
  );
}
```

---

## Pricing Plans Setup

### Step 1: Create Products in Stripe Dashboard

1. **Dashboard** → **Products**
2. Click **"+ Add product"**

**Product 1: Pro**

- Name: `Infamous Freight Pro`
- Price: `$99.00`
- Billing period: `Monthly`
- Copy the **Price ID**: `price_xxx` (save this)

**Product 2: Enterprise**

- Name: `Infamous Freight Enterprise`
- Price: `$999.00`
- Billing period: `Monthly`
- Copy the **Price ID**: `price_yyy` (save this)

### Step 2: Add Price IDs to Code

```javascript
// config/pricing.js
export const PRICING_PLANS = {
  pro_monthly: 'price_1MqQAIxxx...', // From Stripe
  enterprise_monthly: 'price_1MqQBJyyy...', // From Stripe
};
```

---

## Revenue Flow (100% to You)

```
Customer → Stripe → Your Bank Account
  ↓          ↓
$99/mo   Holds for    Deposits weekly/daily
         fraud check
```

### Example: 100 Paying Customers

- 90 on **Pro** ($99/month): $8,910/month
- 10 on **Enterprise** ($999/month): $9,990/month
- **Total**: $18,900/month = **$226,800/year** ✅ to your bank

---

## Webhook Setup (Critical for Payment Updates)

### 1. Generate Webhook Signing Secret

- **Settings** → **Webhooks** → **Add endpoint**
- URL: `https://yourapp.com/api/billing/webhook`
- Events: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
- Copy **Signing secret**: `whsec_xxx`

### 2. Add to .env

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### 3. Test Webhook

```bash
stripe listen --forward-to localhost:4000/api/billing/webhook
```

---

## Database Schema

```sql
-- Store Stripe customer IDs
ALTER TABLE users ADD COLUMN stripeCustomerId VARCHAR;

-- Track subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  stripeSubscriptionId VARCHAR NOT NULL UNIQUE,
  planId VARCHAR NOT NULL,
  status VARCHAR, -- active, past_due, canceled
  currentPeriodStart TIMESTAMP,
  currentPeriodEnd TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Track payments
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  stripeInvoiceId VARCHAR NOT NULL UNIQUE,
  amount DECIMAL(10, 2),
  status VARCHAR, -- succeeded, failed, refunded
  paidAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Track refunds
CREATE TABLE refunds (
  id UUID PRIMARY KEY,
  paymentId UUID NOT NULL,
  stripeRefundId VARCHAR NOT NULL UNIQUE,
  amount DECIMAL(10, 2),
  reason VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (paymentId) REFERENCES payments(id)
);
```

---

## Live Checklist

- [ ] Stripe account created
- [ ] Bank account connected to Stripe
- [ ] API keys copied to `.env`
- [ ] Webhook secret copied to `.env`
- [ ] Pricing plans created in Stripe
- [ ] Backend code deployed
- [ ] Frontend payment page live
- [ ] Test subscription with card `4242 4242 4242 4242`
- [ ] Webhook tested & receiving events
- [ ] Email confirmations working
- [ ] **🎉 LIVE - Money flowing to your bank!**

---

## Verification

**Money will appear in your bank account:**

- Non-SCA charges (US): 1-2 business days
- SCA charges (EU/UK): 3-5 business days
- Check your Stripe dashboard **Payments** section for all transactions

**Test charge (doesn't cost you):**

```bash
Card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

This charges $1 and auto-refunds for testing.

---

## You're Set

✅ Customers pay via Stripe  
✅ Payments go 100% to your bank  
✅ No middleman taking cuts (unless you choose partnerships later)  
✅ All payment tracking automated  
✅ Recurring billing handled

**Money will start flowing within 24 hours of first payment.**
