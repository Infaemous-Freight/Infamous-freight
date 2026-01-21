# Route Scope Registry & Authorization Guide

This document describes all API routes, their required scopes, and org requirements.

## Route-Scope Mapping

See [api/src/lib/routeScopeRegistry.js](../api/src/lib/routeScopeRegistry.js) for the authoritative registry.

### Shipments (Organization-Bound)

| Route | Method | Scopes | Org Required |
|-------|--------|--------|-------------|
| `/api/shipments` | GET | `shipments:read` | ✅ Yes |
| `/api/shipments` | POST | `shipments:write` | ✅ Yes |
| `/api/shipments/:id` | GET | `shipments:read` | ✅ Yes |
| `/api/shipments/:id` | PATCH | `shipments:write` | ✅ Yes |
| `/api/shipments/:id` | DELETE | `shipments:write` | ✅ Yes |
| `/api/shipments/export/:format` | GET | `shipments:read` | ✅ Yes |

### Billing (Organization-Bound)

| Route | Method | Scopes | Org Required |
|-------|--------|--------|-------------|
| `/api/billing/create-payment-intent` | POST | `billing:write` | ✅ Yes |
| `/api/billing/create-subscription` | POST | `billing:write` | ✅ Yes |
| `/api/billing/subscriptions` | GET | `billing:read` | ✅ Yes |
| `/api/billing/cancel-subscription/:id` | POST | `billing:write` | ✅ Yes |
| `/api/billing/revenue` | GET | `billing:read` | ✅ Yes |

### AI Commands (Organization-Bound)

| Route | Method | Scopes | Org Required |
|-------|--------|--------|-------------|
| `/api/ai/commands` | POST | `ai:command` | ✅ Yes |

### Voice (Organization-Bound)

| Route | Method | Scopes | Org Required |
|-------|--------|--------|-------------|
| `/api/voice/ingest` | POST | `voice:ingest` | ✅ Yes |
| `/api/voice/command` | POST | `voice:command` | ✅ Yes |

### Users (Organization-Bound)

| Route | Method | Scopes | Org Required |
|-------|--------|--------|-------------|
| `/api/users/:id` | GET | `user:read` | ✅ Yes |
| `/api/users/:id` | PATCH | `user:write` | ✅ Yes |

### Analytics (Organization-Bound)

| Route | Method | Scopes | Org Required |
|-------|--------|--------|-------------|
| `/api/analytics/dashboard` | GET | `analytics:read` | ✅ Yes |
| `/api/analytics/export` | GET | `analytics:read` | ✅ Yes |

### Metrics (Public metrics endpoint, scoped by metrics scopes)

| Route | Method | Scopes | Org Required |
|-------|--------|--------|-------------|
| `/api/metrics` | GET | None (public) | ❌ No |
| `/api/metrics/revenue/live` | GET | `metrics:read` | ✅ Yes |
| `/api/metrics/revenue/clear-cache` | POST | `admin` | ✅ Yes |
| `/api/metrics/revenue/export` | GET | `metrics:export` | ✅ Yes |

## Adding New Routes

When adding a new protected route:

1. Update [api/src/lib/routeScopeRegistry.js](../api/src/lib/routeScopeRegistry.js)
2. Apply `requireScope()` and `requireOrganization` in route handler
3. Add integration test in `api/src/__tests__/integration/`

Example:

```javascript
router.post(
  "/new-feature",
  limiters.general,
  authenticate,
  requireOrganization,          // ✅ Add org check
  requireScope("new-feature:write"), // ✅ Declare scope
  auditLog,
  [...validators],
  async (req, res, next) => {
    // Handler
  }
);
```

Then in registry:
```javascript
'POST /api/new-feature': ['new-feature:write'],
```

## Testing Scope Enforcement

Use JWT test helper in tests:

```javascript
function signToken(payload = {}) {
  const base = { sub: 'user-1', email: 'u1@example.com', ...payload };
  return jwt.sign(base, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Test missing scope
test('403 when missing scope', async () => {
  const token = signToken({ org_id: 'org-1', scopes: [] });
  const res = await request(app)
    .post('/api/shipments')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(403);
  expect(res.body.error).toMatch(/Insufficient scope/i);
});
```

## Issuing Tokens with Correct Claims

When issuing JWTs (e.g., in login flow), include:

```javascript
const token = jwt.sign({
  sub: userId,                    // User ID
  email: user.email,
  role: user.role,                // 'user', 'admin'
  org_id: user.organizationId,    // Organization ID
  scopes: user.scopes,            // Array: ['shipments:read', 'billing:write', ...]
}, JWT_SECRET, { expiresIn: '1h' });
```

## Common Scopes

- `shipments:read` – List/view shipments
- `shipments:write` – Create/update/delete shipments
- `billing:read` – View billing/revenue
- `billing:write` – Create payments, manage subscriptions
- `ai:command` – Run AI commands
- `voice:ingest` – Upload voice clips
- `voice:command` – Execute voice commands
- `analytics:read` – View analytics
- `metrics:read` – View metrics dashboard
- `metrics:export` – Export metrics
- `admin` – Admin-only operations

## Testing All Routes

To verify scope enforcement on all routes:

```bash
pnpm --filter api test -- --testNamePattern="auth/org/scope enforcement"
```

This runs tests that verify:
- ✅ 401 on missing bearer token
- ✅ 401 on missing `org_id` claim
- ✅ 403 on insufficient scope
