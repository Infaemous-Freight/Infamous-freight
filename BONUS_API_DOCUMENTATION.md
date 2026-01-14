# Bonus & Rewards System - Complete API Documentation

**Version**: 2026.01 | **Status**: Production-Ready | **Last Updated**: January 14, 2026

---

## 📚 API Endpoint Reference

### Base URL

```
Development:  http://localhost:4000/api/bonuses
Production:   https://api.infamousfreight.com/api/bonuses
```

### Authentication

All endpoints require JWT token in Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔄 REFERRAL ENDPOINTS

### Generate Referral Code

**POST** `/referral/generate`

Generate a unique referral code for customer to share.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "referrerEmail": "customer@example.com"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "referralCode": "REF-1704067200000-ABC123",
    "referrerEmail": "customer@example.com",
    "generatedAt": "2026-01-14T10:00:00Z",
    "expiresAt": "2027-01-14T10:00:00Z",
    "shareUrl": "https://infamousfreight.com/join?ref=REF-1704067200000-ABC123"
  }
}
```

**Required Scope:** `bonus:referral`  
**Rate Limit:** 100/15 minutes

---

### Claim Referral Bonus

**POST** `/referral/claim`

Claim reward after referred customer completes first shipment.

**Request Body:**

```json
{
  "referralCode": "REF-1704067200000-ABC123",
  "shipmentCount": 1
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "customerId": "cust_abc123",
    "referralCode": "REF-1704067200000-ABC123",
    "bonus": 75.0,
    "status": "claimed",
    "claimedAt": "2026-01-14T10:05:00Z"
  }
}
```

**Required Scope:** `bonus:referral`

---

### Get Referral Details

**GET** `/referral/:code`

Retrieve information about a specific referral code.

**URL Parameters:**

- `code` (string): Referral code

**Response (200):**

```json
{
  "success": true,
  "data": {
    "referralCode": "REF-1704067200000-ABC123",
    "active": true,
    "bonus": 50.0,
    "currency": "USD",
    "termsUrl": "https://infamousfreight.com/referral-terms"
  }
}
```

---

## 🎟️ LOYALTY TIER ENDPOINTS

### Get Customer Tier Status

**GET** `/loyalty/tier/:customerId`

Get customer's current loyalty tier and related information.

**URL Parameters:**

- `customerId` (string): Customer ID

**Response (200):**

```json
{
  "success": true,
  "data": {
    "customerId": "cust_abc123",
    "currentTier": "silver",
    "level": 2,
    "enrollmentDate": "2025-01-15T00:00:00Z",
    "totalPoints": 2450,
    "pointsBalance": 1200,
    "lifetimeSpend": 1875.5,
    "totalShipments": 48
  }
}
```

**Required Scope:** `bonus:loyalty`

---

### Enroll in Loyalty Program

**POST** `/loyalty/enroll`

Enroll customer in loyalty program (automatic for new customers).

**Response (201):**

```json
{
  "success": true,
  "data": {
    "customerId": "cust_abc123",
    "tier": "bronze",
    "enrollmentDate": "2026-01-14T10:00:00Z",
    "pointsBalance": 0,
    "status": "active"
  }
}
```

**Required Scope:** `bonus:loyalty`

---

### Get Tier Upgrade Progress

**GET** `/loyalty/upgrade-progress/:customerId`

Get progress toward next loyalty tier.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "customerId": "cust_abc123",
    "currentTier": "silver",
    "nextTier": "gold",
    "progress": {
      "points": {
        "current": 2450,
        "required": 5000,
        "percentComplete": 49
      },
      "spend": {
        "current": 1875.5,
        "required": 2500,
        "percentComplete": 75
      },
      "shipments": {
        "current": 48,
        "required": 100,
        "percentComplete": 48
      }
    },
    "nextTierBenefits": [
      "1.5x points multiplier",
      "10% shipping discount",
      "Free signatures & photos"
    ]
  }
}
```

**Required Scope:** `bonus:loyalty`

---

## 💰 POINTS ENDPOINTS

### Record Activity & Earn Points

**POST** `/points/earn`

Record customer activity and award loyalty points.

**Request Body:**

```json
{
  "activityType": "shipment",
  "amount": 125.5
}
```

**Valid Activity Types:**

- `shipment` - Shipping transaction
- `purchase` - Product purchase
- `referral` - Successful referral
- `review` - Left review/rating

**Response (200):**

```json
{
  "success": true,
  "data": {
    "customerId": "cust_abc123",
    "activityType": "shipment",
    "pointsEarned": 157,
    "bonusEarned": 50.0,
    "newPointsBalance": 1357,
    "timestamp": "2026-01-14T10:05:00Z"
  }
}
```

**Required Scope:** `bonus:points`

---

### Redeem Points

**POST** `/points/redeem`

Convert loyalty points to rewards.

**Request Body:**

```json
{
  "pointsToRedeem": 500,
  "method": "accountCredit",
  "pointsBalance": 1200
}
```

**Valid Methods:**

- `accountCredit` - 1.0:1 conversion (instant)
- `freeShipment` - 0.5:1 conversion ($1 credit = $0.50 shipment)
- `discountCode` - 0.8:1 conversion ($1 credit = $0.80 discount)
- `cashback` - 0.75:1 conversion (5-day processing)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "customerId": "cust_abc123",
    "pointsRedeemed": 500,
    "method": "accountCredit",
    "creditValue": 25.0,
    "newPointsBalance": 700,
    "processingTime": "immediate",
    "timestamp": "2026-01-14T10:10:00Z"
  }
}
```

**Required Scope:** `bonus:redeem`

---

### Get Points Balance

**GET** `/points/balance/:customerId`

Get customer's points balance and expiry information.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "customerId": "cust_abc123",
    "pointsBalance": 700,
    "pointsEarned": 2450,
    "pointsRedeemed": 1750,
    "expiryDate": "2027-01-14T23:59:59Z"
  }
}
```

**Required Scope:** `bonus:points`

---

## 🏆 MILESTONE ENDPOINTS

### Get Milestone Achievements

**GET** `/milestones/:customerId`

Get all milestones achieved by customer.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "customerId": "cust_abc123",
    "unlockedMilestones": [
      {
        "type": "shipment",
        "milestone": "10",
        "bonus": 10.0,
        "description": "10 shipments"
      },
      {
        "type": "shipment",
        "milestone": "25",
        "bonus": 25.0,
        "description": "25 shipments"
      },
      {
        "type": "volume",
        "milestone": "1000",
        "bonus": 100.0,
        "description": "$1,000 spent"
      },
      {
        "type": "tenure",
        "milestone": "6months",
        "bonus": 75.0,
        "description": "6 months active"
      }
    ],
    "totalBonus": 210.0
  }
}
```

**Required Scope:** `bonus:milestones`

---

## 📊 PERFORMANCE ENDPOINTS

### Calculate Driver Performance Bonus

**POST** `/performance/calculate`

Calculate performance-based bonuses for drivers.

**Request Body:**

```json
{
  "onTimePercentage": 97.5,
  "averageRating": 4.8,
  "monthlyShipments": 320,
  "accidentsFreeMonths": 12,
  "referralsCount": 5
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "driverId": "drv_abc123",
    "totalBonus": 2050.0,
    "breakdown": {
      "onTimeDelivery": {
        "percentage": 97.5,
        "bonus": 500.0
      },
      "customerRating": {
        "rating": 4.8,
        "bonus": 300.0
      },
      "volumeIncentive": {
        "shipments": 320,
        "bonus": 1250.0,
        "percent": 4.0
      },
      "safety": {
        "accidentsFreeMonths": 12,
        "bonus": 2000.0
      },
      "referrals": {
        "count": 5,
        "bonus": 500.0
      }
    }
  }
}
```

**Required Scope:** `bonus:performance`  
**Rate Limit:** 20/1 minute

---

## 📋 REPORT ENDPOINTS

### Generate Loyalty Report

**GET** `/report/:customerId`

Generate comprehensive loyalty and bonus report for customer.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "customerId": "cust_abc123",
    "generatedDate": "2026-01-14T10:00:00Z",
    "tierStatus": {
      "currentTier": "silver",
      "level": 2,
      "color": "#C0C0C0",
      "membershipMonths": 12
    },
    "pointsStatus": {
      "balance": 700,
      "earned": 2450,
      "expiryDate": "2027-01-14T23:59:59Z"
    },
    "activity": {
      "lifetimeSpend": 1875.5,
      "totalShipments": 48,
      "lastActivityDays": 5,
      "status": "Active"
    },
    "monthlyBonuses": {
      "monthlyBonus": 100,
      "quarterlyBonus": 250,
      "annualBonus": 0
    },
    "benefits": {
      "pointsMultiplier": 1.25,
      "shippingDiscount": 0.05,
      "expressShippingDiscount": 0.1,
      "features": [
        "Earn 1.25 points per $1 spent",
        "Monthly 100 bonus points",
        "5% discount on standard shipping"
      ]
    },
    "recommendations": [
      {
        "type": "upgrade",
        "message": "Continue shipping to reach Gold tier!"
      }
    ]
  }
}
```

**Required Scope:** `bonus:report`

---

## 🔧 SYSTEM ENDPOINTS

### Bonus System Health Check

**GET** `/health`

Check health status of bonus system.

**Response (200):**

```json
{
  "success": true,
  "status": "operational",
  "version": "2026.01",
  "components": {
    "bonusEngine": "healthy",
    "loyaltyProgram": "healthy",
    "database": "connected"
  }
}
```

**Rate Limit:** None (health check exempt)

---

## ⚠️ ERROR RESPONSES

All error responses follow standard format:

**400 Bad Request:**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "pointsToRedeem",
      "msg": "Points to redeem must be greater than 50"
    }
  ]
}
```

**401 Unauthorized:**

```json
{
  "error": "Invalid or expired token"
}
```

**403 Forbidden:**

```json
{
  "error": "Insufficient scope",
  "required": ["bonus:redeem"]
}
```

**404 Not Found:**

```json
{
  "error": "Customer not found",
  "customerId": "cust_invalid"
}
```

**429 Too Many Requests:**

```json
{
  "error": "Too many requests. Try again later."
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal server error",
  "requestId": "req_abc123xyz"
}
```

---

## 🔐 SCOPES REFERENCE

| Scope               | Operations                          |
| ------------------- | ----------------------------------- |
| `bonus:referral`    | Generate & claim referral codes     |
| `bonus:loyalty`     | Enroll in loyalty, view tier status |
| `bonus:points`      | Earn points, view balance           |
| `bonus:redeem`      | Redeem points for rewards           |
| `bonus:milestones`  | View milestone achievements         |
| `bonus:performance` | Calculate performance bonuses       |
| `bonus:report`      | Generate loyalty reports            |

---

## 📊 RATE LIMITS

| Endpoint Group           | Limit      |
| ------------------------ | ---------- |
| General endpoints        | 100/15 min |
| Performance calculations | 20/1 min   |
| Health check             | Unlimited  |

---

## 🔄 EXAMPLE WORKFLOWS

### Workflow 1: New Customer Registration & Referral

```
1. POST /loyalty/enroll → Create Bronze tier
2. POST /referral/generate → Get referral code
3. Customer shares referral code
4. Referred customer uses code at signup
5. POST /referral/claim → Claim $50 bonus
```

### Workflow 2: Earn and Redeem Points

```
1. POST /points/earn (shipment) → +150 points
2. GET /points/balance → Check balance
3. GET /loyalty/upgrade-progress → View upgrade path
4. POST /points/redeem → Convert 500 points to $25 credit
```

### Workflow 3: Driver Performance Bonus

```
1. Collect driver metrics (delivery time, ratings, etc.)
2. POST /performance/calculate → Calculate bonus
3. Response includes breakdown of performance bonuses
4. Approve and process payment in accounting system
```

---

## 📚 RELATED DOCUMENTATION

- [Bonus System Overview](BONUSES_2026_COMPLETE.md)
- [Loyalty Tiers Guide](BONUSES_2026_COMPLETE.md#-loyalty-tiers)
- [Bonus Categories](BONUSES_2026_COMPLETE.md#-bonus-programs)
- [Integration Guide](BONUSES_2026_COMPLETE.md#-integration-points)

---

**Version**: 2026.01 | **Status**: Complete ✅ | **Last Updated**: January 14, 2026
