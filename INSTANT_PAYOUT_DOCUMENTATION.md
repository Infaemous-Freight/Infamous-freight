# Instant Payment & Payout System - Complete Documentation

## 🚀 Get Paid Today - Instant Payout System

**Status**: ✅ 100% Complete & Production-Ready  
**Processing Time**: 0-15 minutes for instant payouts  
**Daily Availability**: 24/7/365  
**Supported Currencies**: USD, EUR, GBP, CAD, AUD

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Instant Payout Features](#instant-payout-features)
3. [Payment Methods](#payment-methods)
4. [API Endpoints](#api-endpoints)
5. [Fee Structure](#fee-structure)
6. [Integration Guide](#integration-guide)
7. [Security & Compliance](#security--compliance)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Infamous Freight Instant Payout System enables **same-day payments** with funds arriving in **0-15 minutes** for drivers, contractors, and bonus recipients. Built on enterprise-grade payment infrastructure with Stripe and PayPal integration.

### Key Benefits

✅ **Instant Access** - Get paid in 0-15 minutes  
✅ **Multiple Methods** - Stripe, PayPal, Debit Card, Bank Transfer  
✅ **Low Fees** - Starting at 0.25% for standard payouts  
✅ **Secure** - Bank-level encryption and PCI compliance  
✅ **24/7 Availability** - Request payouts anytime  
✅ **Global Support** - 5 major currencies supported

---

## Instant Payout Features

### 🏃 Instant Payout (0-15 min)

**Arrives**: 0-15 minutes  
**Fee**: 1.5% + $0.25  
**Min Amount**: $10  
**Max Amount**: $25,000 per transaction  
**Methods**: Stripe, PayPal, Debit Card

**Perfect for:**
- Urgent expenses
- Same-day needs
- Immediate bonus redemption
- Driver daily earnings

### 📅 Standard Payout (1-2 business days)

**Arrives**: 1-2 business days  
**Fee**: 0.25%  
**Min Amount**: $1  
**Max Amount**: $100,000 per transaction  
**Methods**: Bank Transfer (ACH), Stripe, PayPal

**Perfect for:**
- Weekly earnings
- Large transfers
- Cost-conscious users
- Scheduled payouts

---

## Payment Methods

### 1. Stripe Connect

**Type**: Instant & Standard  
**Instant Support**: ✅ Yes  
**Processing Time**: 0-15 minutes (instant), 1-2 days (standard)  
**Currencies**: USD, EUR, GBP, CAD, AUD  
**Fee**: 1.5% + $0.25 (instant), 0.25% (standard)

**Setup**:
```bash
# User connects Stripe account
POST /api/payments/methods/connect
{
  "provider": "stripe",
  "accountId": "acct_xxxxx"
}
```

### 2. PayPal

**Type**: Instant & Standard  
**Instant Support**: ✅ Yes  
**Processing Time**: 0-15 minutes (instant), 1-2 days (standard)  
**Currencies**: USD, EUR, GBP, CAD, AUD  
**Fee**: 1.5% + $0.25 (instant), 0.25% (standard)

**Setup**:
```bash
POST /api/payments/methods/connect
{
  "provider": "paypal",
  "email": "user@example.com"
}
```

### 3. Debit Card

**Type**: Instant Only  
**Instant Support**: ✅ Yes  
**Processing Time**: 0-15 minutes  
**Currencies**: USD  
**Fee**: 1.5% + $0.25

**Requirements**: Visa or Mastercard debit card

### 4. Bank Transfer (ACH)

**Type**: Standard Only  
**Instant Support**: ❌ No  
**Processing Time**: 1-2 business days  
**Currencies**: USD  
**Fee**: 0.25%

**Best For**: Large transfers, cost-conscious users

---

## API Endpoints

### Request Instant Payout

**Endpoint**: `POST /api/payments/payout/instant`  
**Auth**: Required (JWT + `payment:payout` scope)  
**Rate Limit**: 30 requests per 15 minutes

**Request**:
```json
{
  "amount": 100.00,
  "method": "stripe",
  "destination": "acct_1234567890",
  "currency": "USD",
  "reason": "Driver daily earnings"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "payout_abc123",
    "amount": 100.00,
    "netAmount": 98.25,
    "currency": "USD",
    "method": "stripe",
    "fees": {
      "percentage": 1.50,
      "fixed": 0.25,
      "total": 1.75,
      "rate": "1.5% + $0.25"
    },
    "status": "processing",
    "estimatedArrival": "2026-01-14T12:15:00Z",
    "processedAt": "2026-01-14T12:00:00Z"
  },
  "message": "Instant payout initiated - funds arriving in 0-15 minutes"
}
```

### Request Standard Payout

**Endpoint**: `POST /api/payments/payout/standard`  
**Auth**: Required (JWT + `payment:payout` scope)  
**Rate Limit**: 30 requests per 15 minutes

**Request**:
```json
{
  "amount": 500.00,
  "method": "bankTransfer",
  "destination": "bank_account_123",
  "currency": "USD",
  "reason": "Weekly earnings"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "payout_xyz789",
    "amount": 500.00,
    "netAmount": 498.75,
    "currency": "USD",
    "method": "bankTransfer",
    "fees": {
      "percentage": 1.25,
      "fixed": 0.00,
      "total": 1.25,
      "rate": "0.25% + $0"
    },
    "status": "scheduled",
    "estimatedArrival": "2026-01-16T12:00:00Z",
    "scheduledAt": "2026-01-14T12:00:00Z"
  },
  "message": "Standard payout scheduled - arriving in 1-2 business days"
}
```

### Process Bonus Payout

**Endpoint**: `POST /api/payments/bonus/payout`  
**Auth**: Required (JWT + `payment:bonus` scope)  
**Rate Limit**: 30 requests per 15 minutes

**Request**:
```json
{
  "bonusId": "bonus_ref_123",
  "amount": 50.00,
  "bonusType": "referral",
  "paymentMethod": "stripe"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "payout_bonus_456",
    "amount": 50.00,
    "netAmount": 48.50,
    "bonusType": "referral",
    "status": "processing",
    "estimatedArrival": "2026-01-14T12:15:00Z"
  },
  "message": "Bonus payout processed - arriving in 0-15 minutes"
}
```

### Get Payout Status

**Endpoint**: `GET /api/payments/payout/:payoutId/status`  
**Auth**: Required (JWT + `payment:view` scope)  
**Rate Limit**: 100 requests per 15 minutes

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "arrivalDate": "2026-01-14T12:12:00Z",
    "amount": 100.00,
    "currency": "USD"
  }
}
```

### Get Available Payment Methods

**Endpoint**: `GET /api/payments/methods`  
**Auth**: Required (JWT + `payment:view` scope)  
**Rate Limit**: 100 requests per 15 minutes

**Response**:
```json
{
  "success": true,
  "data": {
    "methods": [
      {
        "id": "stripe",
        "name": "Stripe",
        "type": "instant",
        "fee": { "percentage": 1.5, "fixed": 0.25 },
        "processingTime": "0-15 minutes",
        "supported": true
      },
      {
        "id": "paypal",
        "name": "PayPal",
        "type": "instant",
        "fee": { "percentage": 1.5, "fixed": 0.25 },
        "processingTime": "0-15 minutes",
        "supported": true
      }
    ],
    "defaultMethod": "stripe"
  }
}
```

### Calculate Payout Fees

**Endpoint**: `GET /api/payments/fees/calculate`  
**Auth**: Required (JWT + `payment:view` scope)  
**Rate Limit**: 100 requests per 15 minutes

**Query Parameters**:
- `amount` (required): Payout amount
- `type` (optional): `instant` or `standard` (default: `instant`)

**Response**:
```json
{
  "success": true,
  "data": {
    "amount": 100.00,
    "fees": {
      "percentage": 1.50,
      "fixed": 0.25,
      "total": 1.75,
      "rate": "1.5% + $0.25"
    },
    "netAmount": 98.25,
    "type": "instant"
  }
}
```

---

## Fee Structure

### Instant Payout Fees

| Amount | Percentage Fee | Fixed Fee | Total Fee | You Receive |
|--------|---------------|-----------|-----------|-------------|
| $50 | $0.75 | $0.25 | $1.00 | $49.00 |
| $100 | $1.50 | $0.25 | $1.75 | $98.25 |
| $500 | $7.50 | $0.25 | $7.75 | $492.25 |
| $1,000 | $15.00 | $0.25 | $15.25 | $984.75 |

**Formula**: `fee = (amount × 0.015) + 0.25`

### Standard Payout Fees

| Amount | Percentage Fee | Fixed Fee | Total Fee | You Receive |
|--------|---------------|-----------|-----------|-------------|
| $100 | $0.25 | $0.00 | $0.25 | $99.75 |
| $500 | $1.25 | $0.00 | $1.25 | $498.75 |
| $1,000 | $2.50 | $0.00 | $2.50 | $997.50 |
| $5,000 | $12.50 | $0.00 | $12.50 | $4,987.50 |

**Formula**: `fee = amount × 0.0025`

---

## Integration Guide

### Step 1: Connect Payment Method

```javascript
// Frontend: Stripe Connect integration
const connectStripe = async () => {
  const response = await fetch('/api/payments/methods/connect', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: 'stripe',
      accountId: stripeAccountId,
    }),
  });
  
  return response.json();
};
```

### Step 2: Request Instant Payout

```javascript
// Frontend: Request instant payout
const requestPayout = async (amount) => {
  const response = await fetch('/api/payments/payout/instant', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: parseFloat(amount),
      method: 'stripe',
      destination: userPaymentDestination,
      currency: 'USD',
      reason: 'User requested payout',
    }),
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Payout initiated:', result.data.id);
    console.log('Arriving at:', result.data.estimatedArrival);
  }
  
  return result;
};
```

### Step 3: Check Payout Status

```javascript
// Frontend: Poll for payout status
const checkPayoutStatus = async (payoutId) => {
  const response = await fetch(`/api/payments/payout/${payoutId}/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
};

// Poll every 30 seconds
const pollStatus = setInterval(async () => {
  const status = await checkPayoutStatus(payoutId);
  
  if (status.data.status === 'completed') {
    console.log('Payout completed!');
    clearInterval(pollStatus);
  }
}, 30000);
```

---

## Security & Compliance

### Authentication

All payout endpoints require:
- ✅ Valid JWT token
- ✅ Required scopes (`payment:payout`, `payment:view`, etc.)
- ✅ Rate limiting (30 requests per 15 minutes for payouts)

### Data Protection

- ✅ **Encryption**: All payment data encrypted at rest and in transit (TLS 1.3)
- ✅ **PCI Compliance**: Level 1 PCI DSS certified
- ✅ **Data Masking**: Sensitive data (account numbers, card numbers) masked in logs
- ✅ **Audit Trail**: All transactions logged with full audit history

### Fraud Prevention

- ✅ **Velocity Limits**: Maximum $25,000 per instant payout
- ✅ **Daily Limits**: Configurable per-user limits
- ✅ **Risk Scoring**: Real-time fraud detection
- ✅ **2FA Required**: For first payout or large amounts

---

## Troubleshooting

### Common Errors

#### `VALIDATION_ERROR` - Amount below minimum

**Error**:
```json
{
  "success": false,
  "error": "Minimum payout amount is $10",
  "code": "VALIDATION_ERROR"
}
```

**Solution**: Increase payout amount to at least $10 for instant payouts, or $1 for standard payouts.

#### `VALIDATION_ERROR` - Amount above maximum

**Error**:
```json
{
  "success": false,
  "error": "Maximum payout amount is $25,000",
  "code": "VALIDATION_ERROR"
}
```

**Solution**: Split into multiple payouts or use standard payout (max $100,000).

#### `INVALID_METHOD` - Unsupported payment method

**Error**:
```json
{
  "success": false,
  "error": "bankTransfer does not support instant payouts",
  "code": "VALIDATION_ERROR"
}
```

**Solution**: Use `stripe`, `paypal`, or `debitCard` for instant payouts. Bank transfers only support standard payouts.

#### `NO_PAYMENT_METHOD` - Missing payment configuration

**Error**:
```json
{
  "success": false,
  "error": "No payment method configured",
  "code": "NO_PAYMENT_METHOD"
}
```

**Solution**: Connect a payment method first using `POST /api/payments/methods/connect`.

#### `PAYOUT_FAILED` - Processing error

**Error**:
```json
{
  "success": false,
  "error": "Stripe payout failed: Insufficient funds",
  "code": "PAYOUT_FAILED"
}
```

**Solution**: Check platform balance or contact support.

### Rate Limiting

If you receive a `429 Too Many Requests` error:

- **Instant/Standard Payouts**: Wait 15 minutes or reduce request frequency
- **View Operations**: Limit to 100 requests per 15 minutes
- **Consider**: Batch processing for multiple payouts

### Support

For payout issues or questions:

- **Email**: payouts@infamousfreight.com
- **Slack**: #payments-support
- **Phone**: 1-800-FREIGHT (24/7)
- **Documentation**: docs.infamousfreight.com/payouts

---

## Quick Reference

### Instant Payout Checklist

✅ Amount between $10 - $25,000  
✅ Payment method supports instant (Stripe, PayPal, Debit Card)  
✅ Valid JWT with `payment:payout` scope  
✅ User has connected payment account  
✅ Accept 1.5% + $0.25 fee

### Standard Payout Checklist

✅ Amount between $1 - $100,000  
✅ Valid JWT with `payment:payout` scope  
✅ User has connected payment account  
✅ Accept 0.25% fee  
✅ Can wait 1-2 business days

---

**Version**: 2026.01  
**Status**: ✅ Production Ready  
**Last Updated**: January 14, 2026

🎉 **Get Paid Today - Instant Payouts in 0-15 Minutes!** 🎉
