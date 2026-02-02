# Infamous Freight Enterprises - API Reference

**Base URL**: `https://infamous-freight-api.fly.dev`

---

## Authentication

All endpoints (except `/api/health`) require JWT authentication.

### Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### JWT Claims

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "user|admin|driver",
  "scopes": ["users:read", "shipments:read", "ai:command", "billing:*"],
  "iat": 1702756800,
  "exp": 1702843200
}
```

---

## Core Endpoints

### Health Check

**GET** `/api/health`

Check API health and database connection status.

**Status**: No authentication required  
**Rate Limit**: 100/15min

**Response** (200 OK):

```json
{
  "uptime": 3600,
  "timestamp": 1702756800000,
  "status": "ok",
  "database": "connected"
}
```

**Response** (503 Service Unavailable):

```json
{
  "uptime": 3600,
  "timestamp": 1702756800000,
  "status": "degraded",
  "database": "disconnected"
}
```

---

## Users Endpoints

### GET /api/users

List all users with pagination.

**Authentication**: Required (`users:read`)  
**Rate Limit**: 100/15min

**Response** (200 OK):

```json
{
  "ok": true,
  "users": [
    {
      "id": "user-001",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2025-12-16T19:40:00Z",
      "updatedAt": "2025-12-16T19:40:00Z"
    }
  ]
}
```

---

### GET /api/users/search

Search users with filtering, sorting, and pagination.

**Authentication**: Required (`users:read`)  
**Rate Limit**: 100/15min

**Query Parameters**:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `q` | string | "" | 100 | Search query (email/name, case-insensitive) |
| `page` | number | 1 | - | Page number (1-indexed) |
| `limit` | number | 10 | 100 | Results per page |
| `role` | string | - | - | Filter by role: `user`, `admin`, `driver` |
| `sortBy` | string | createdAt | - | Sort field: `name`, `email`, `createdAt` |
| `order` | string | desc | - | Sort order: `asc`, `desc` |

**Examples**:

```bash
# Search for drivers named "john"
curl -H "Authorization: Bearer TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/search?q=john&role=driver"

# Sort by email ascending, 25 per page
curl -H "Authorization: Bearer TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/search?sortBy=email&order=asc&limit=25"

# Page 2 of results
curl -H "Authorization: Bearer TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/search?page=2&limit=10"
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "driver-001",
        "email": "alice@example.com",
        "name": "Alice Brown",
        "role": "driver",
        "createdAt": "2025-12-10T15:00:00Z",
        "updatedAt": "2025-12-16T19:40:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

---

### GET /api/users/:id

Get a specific user by ID.

**Authentication**: Required (`users:read`)  
**Rate Limit**: 100/15min

**URL Parameters**:

- `id` (string, required) - User ID

**Examples**:

```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/user-001"
```

**Response** (200 OK):

```json
{
  "ok": true,
  "user": {
    "id": "user-001",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2025-12-16T19:40:00Z",
    "updatedAt": "2025-12-16T19:40:00Z"
  }
}
```

**Response** (404 Not Found):

```json
{
  "ok": false,
  "error": "User not found"
}
```

---

### POST /api/users

Create a new user.

**Authentication**: Required (`users:write`)  
**Rate Limit**: 5/15min (auth limiter)

**Body**:

```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "user"
}
```

**Validation Rules**:

- `email` (required): Valid email format (RFC 5322)
- `name` (optional): String, 1-100 characters (auto-trimmed)
- `role` (optional): One of `user`, `admin`, `driver` (default: `user`)

**Examples**:

```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "name": "John Driver",
    "role": "driver"
  }' \
  "https://infamous-freight-api.fly.dev/api/users"
```

**Response** (201 Created):

```json
{
  "ok": true,
  "user": {
    "id": "user-new-001",
    "email": "driver@example.com",
    "name": "John Driver",
    "role": "driver",
    "createdAt": "2025-12-16T19:40:00Z",
    "updatedAt": "2025-12-16T19:40:00Z"
  }
}
```

**Response** (400 Bad Request - Validation Error):

```json
{
  "ok": false,
  "error": "Validation Error",
  "details": [
    {
      "value": "invalid-email",
      "msg": "Invalid email format",
      "param": "email",
      "location": "body"
    }
  ]
}
```

**Response** (409 Conflict - Email Exists):

```json
{
  "ok": false,
  "error": "Email already exists"
}
```

---

### PATCH /api/users/:id

Update a user.

**Authentication**: Required (`users:write`)  
**Rate Limit**: 100/15min

**URL Parameters**:

- `id` (string, required) - User ID

**Body** (at least one field required):

```json
{
  "name": "Updated Name",
  "role": "admin"
}
```

**Examples**:

```bash
curl -X PATCH \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "driver"
  }' \
  "https://infamous-freight-api.fly.dev/api/users/user-001"
```

**Response** (200 OK):

```json
{
  "ok": true,
  "user": {
    "id": "user-001",
    "email": "john@example.com",
    "name": "Updated Name",
    "role": "driver",
    "createdAt": "2025-12-16T19:40:00Z",
    "updatedAt": "2025-12-16T19:50:00Z"
  }
}
```

---

### DELETE /api/users/:id

Delete a user.

**Authentication**: Required (`users:write`)  
**Rate Limit**: 100/15min

**URL Parameters**:

- `id` (string, required) - User ID

**Examples**:

```bash
curl -X DELETE \
  -H "Authorization: Bearer TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/user-001"
```

**Response** (200 OK):

```json
{
  "ok": true,
  "message": "User deleted successfully"
}
```

---

## Shipments Endpoints

### GET /api/shipments

List all shipments.

**Authentication**: Required (`shipments:read`)  
**Rate Limit**: 100/15min

**Response** (200 OK):

```json
{
  "ok": true,
  "shipments": [
    {
      "id": "shipment-001",
      "trackingNumber": "TRK-2025-001",
      "origin": "New York",
      "destination": "Los Angeles",
      "status": "in_transit",
      "createdAt": "2025-12-16T19:40:00Z"
    }
  ]
}
```

---

### GET /api/shipments/:id

Get a specific shipment.

**Authentication**: Required (`shipments:read`)  
**Rate Limit**: 100/15min

---

### POST /api/shipments

Create a new shipment.

**Authentication**: Required (`shipments:write`)  
**Rate Limit**: 100/15min

**Body**:

```json
{
  "trackingNumber": "TRK-2025-002",
  "origin": "Chicago",
  "destination": "Miami",
  "status": "pending"
}
```

---

## AI Endpoints

### POST /api/ai/command

Execute an AI command (OpenAI, Anthropic, or synthetic fallback).

**Authentication**: Required (`ai:command`)  
**Rate Limit**: 20/1min (aggressive limiter)

**Body**:

```json
{
  "command": "optimize",
  "payload": {
    "shipments": [...],
    "constraints": {...}
  }
}
```

**Response** (200 OK):

```json
{
  "ok": true,
  "result": {
    "provider": "openai",
    "text": "AI response here...",
    "metadata": {...}
  }
}
```

---

## Billing Endpoints

### POST /api/billing/stripe/session

Create a Stripe checkout session for a plan.

**Authentication**: Required (`billing:*`)  
**Rate Limit**: 30/15min

**Body**

```json
{
  "plan": "starter | growth | enterprise",
  "quantity": 1,
  "successUrl": "https://app.yourdomain.com/billing/success",
  "cancelUrl": "https://app.yourdomain.com/billing/cancel"
}
```

**Response** (201 Created):

```json
{
  "ok": true,
  "sessionId": "sess_123",
  "plan": "starter",
  "quantity": 1,
  "amountCents": 4900,
  "currency": "usd",
  "url": "https://billing.stripe.com/...",
  "features": ["50 AI audits", "Voice commands", "Basic avatars"]
}
```

### POST /api/billing/paypal/order

Create a PayPal order for a plan.

**Authentication**: Required (`billing:*`)  
**Rate Limit**: 30/15min

**Response** (201 Created):

```json
{
  "ok": true,
  "orderId": "order_abc",
  "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=order_abc",
  "plan": "growth",
  "quantity": 1,
  "amountCents": 12900,
  "currency": "usd"
}
```

### POST /api/billing/paypal/capture

Capture an approved PayPal order.

**Authentication**: Required (`billing:*`)

**Body**:

```json
{
  "orderId": "order_abc",
  "note": "Optional note for audit trail"
}
```

**Response** (200 OK):

```json
{
  "ok": true,
  "orderId": "order_abc",
  "captureId": "cap_123",
  "status": "captured"
}
```

---

## Voice Endpoints

### POST /api/voice/command

Process a text command from the voice interface.

**Authentication**: Required (`voice:command`)  
**Rate Limit**: 60/15min

**Body**:

```json
{
  "text": "Audit invoice 1234",
  "channel": "mobile",
  "metadata": { "priority": "high" }
}
```

**Response** (200 OK):

```json
{
  "ok": true,
  "intent": "invoice_audit",
  "confidence": 0.82,
  "decisionId": "dec_456",
  "recommended": ["Queue invoice for audit workflow", "..."],
  "trace": {
    "tags": ["invoice", "audit"],
    "summary": "Audit invoice 1234",
    "memory": [{ "key": "vendor:abc", "confidence": 0.9 }]
  }
}
```

### POST /api/voice/ingest

Upload and transcribe audio.

**Authentication**: Required (`voice:ingest`)  
**Rate Limit**: 100/15min

**File Upload** (Multipart Form Data):

- `audio` (file, required): MP3/WAV/M4A, max 10MB
- Response returns `referenceId`, `filename`, `mimetype`, `sizeMb`

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-12-16T19:40:00Z"
}
```

### Common Status Codes

| Code | Meaning             | Example                            |
| ---- | ------------------- | ---------------------------------- |
| 200  | OK                  | Successful GET/PATCH               |
| 201  | Created             | Successful POST (create)           |
| 400  | Bad Request         | Invalid input, validation failed   |
| 401  | Unauthorized        | Missing/invalid JWT token          |
| 403  | Forbidden           | Valid token but insufficient scope |
| 404  | Not Found           | Resource doesn't exist             |
| 409  | Conflict            | Email already exists               |
| 429  | Too Many Requests   | Rate limit exceeded                |
| 500  | Server Error        | Unhandled exception                |
| 503  | Service Unavailable | Database disconnected              |

---

## Rate Limiting

Rate limits apply per endpoint and scope:

| Category              | Limit | Window     |
| --------------------- | ----- | ---------- |
| General               | 100   | 15 minutes |
| Auth (login/register) | 5     | 15 minutes |
| AI Commands           | 20    | 1 minute   |
| Billing               | 30    | 15 minutes |

**Headers in Response**:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1702760400
```

---

## Testing with curl

### 1. Get Health (No Auth)

```bash
curl https://infamous-freight-api.fly.dev/api/health
```

### 2. Search Users

```bash
TOKEN="your-jwt-token-here"

# Simple search
curl -H "Authorization: Bearer $TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/search?q=john"

# Advanced search with filtering and pagination
curl -H "Authorization: Bearer $TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/search?q=john&role=driver&page=1&limit=25&sortBy=name&order=asc"
```

### 3. Create User

```bash
TOKEN="your-jwt-token-here"

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "role": "driver"
  }' \
  "https://infamous-freight-api.fly.dev/api/users"
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are CUID format (Compact Unique IDs)
- Request IDs are returned in error responses for debugging
- Database queries use Prisma ORM with connection pooling
- See [VALIDATION.md](VALIDATION.md) for detailed validation rules
- See [SENTRY_MONITORING.md](docs/SENTRY_MONITORING.md) for error tracking

---

**Last Updated**: December 16, 2025  
**API Version**: 1.0.0  
**Status**: Production (<https://infamous-freight-api.fly.dev>)
