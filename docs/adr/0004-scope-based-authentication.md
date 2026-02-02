# ADR-0004: Scope-Based RBAC Authentication

## Status

Accepted

## Context

The API needed an authorization system to control access to endpoints. Requirements:

- Protect sensitive endpoints (billing, AI commands, admin operations)
- Support fine-grained permissions
- Enable future role expansion
- Maintain JWT token compatibility
- Simple to implement and maintain

Authorization strategies considered:

1. **Role-Based Access Control (RBAC)**: Coarse-grained roles (admin, driver, user)
2. **Attribute-Based Access Control (ABAC)**: Complex attribute evaluation
3. **Scope-Based RBAC**: JWT scopes with middleware validation
4. **Policy-Based**: External policy engine (OPA, Casbin)

## Decision

We implemented **scope-based RBAC** using JWT claims and Express middleware.

**Architecture:**

```javascript
// JWT token structure
{
  sub: "user-id",
  email: "user@example.com",
  role: "driver",
  scopes: ["ai:command", "voice:ingest", "voice:command"],
  iat: 1234567890,
  exp: 1234571490
}
```

**Middleware pattern:**

```javascript
// api/src/middleware/security.js
function requireScope(requiredScope) {
  return (req, res, next) => {
    const userScopes = req.user?.scopes || [];
    if (!userScopes.includes(requiredScope)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
```

**Route protection:**

```javascript
router.post(
  "/ai/command",
  limiters.ai, // Rate limiting
  authenticate, // JWT verification
  requireScope("ai:command"), // Scope check
  auditLog, // Audit trail
  async (req, res) => {
    // Handler logic
  },
);
```

**Scope naming convention:**

- Format: `resource:action`
- Examples: `ai:command`, `billing:write`, `voice:ingest`, `admin:users`

**Current scopes:**

| Scope | Description | Used By |
|-------|-------------|---------|
| `ai:command` | Execute AI inference | Driver app, web dashboard |
| `voice:ingest` | Upload voice recordings | Driver app |
| `voice:command` | Convert voice to text commands | Driver app |
| `billing:write` | Manage billing/subscriptions | Admin panel |
| `billing:read` | View billing information | Users, admins |

## Rationale

**Why scope-based over pure RBAC:**

- Scopes provide finer granularity than roles alone
- Easy to extend without modifying role definitions
- Multiple scopes per user enable flexible permissions
- Industry standard (OAuth 2.0, OpenID Connect)
- Simple middleware implementation

**Why not ABAC:**

- Too complex for current needs (overkill)
- Harder to debug permission issues
- Steeper learning curve for team
- Can migrate to ABAC later if needed

**Why not external policy engine:**

- Additional infrastructure complexity
- Increased latency on every request
- Overkill for current scale (thousands, not millions of requests)
- Can integrate later if policies become complex

## Consequences

**Positive:**

- ✅ Clear, declarative permission requirements on routes
- ✅ Easy to add new scopes without migration
- ✅ Standard JWT claims (portable across services)
- ✅ Testable with simple JWT generation
- ✅ Audit-friendly (scopes visible in tokens)
- ✅ Self-documenting routes (scope name describes permission)

**Negative:**

- ❌ Token size grows with many scopes (mitigated by typical ~5-10 scopes per user)
- ❌ Scope changes require token refresh
- ❌ No hierarchical scopes (e.g., `admin:*` matching all admin scopes)
- ❌ Scope assignment logic lives outside auth middleware

**Security considerations:**

```javascript
// ✅ GOOD: Specific scope checks
requireScope("billing:write");

// ❌ BAD: Broad or missing checks
requireScope("admin"); // Too coarse
// (no scope check)     // Unprotected
```

**Testing pattern:**

```javascript
const makeToken = (scopes) =>
  jwt.sign({ sub: "test-user", scopes }, process.env.JWT_SECRET);

test("rejects request without ai:command scope", async () => {
  const token = makeToken(["voice:ingest"]);
  const res = await request(app)
    .post("/api/ai/command")
    .set("Authorization", `Bearer ${token}`)
    .send({ command: "test" });

  expect(res.status).toBe(403);
});
```

## Future Enhancements

If scope management becomes complex:

1. Add scope hierarchy (e.g., `admin:*` → all admin scopes)
2. Implement scope groups in database
3. Create admin UI for scope assignment
4. Add time-limited scopes (expire specific permissions)
5. Integrate external policy engine for complex rules

## Related

- [ADR-0001: Monorepo Architecture](0001-monorepo-architecture.md)
- JWT Best Practices: <https://datatracker.ietf.org/doc/html/rfc8725>
- OAuth 2.0 Scopes: <https://datatracker.ietf.org/doc/html/rfc6749#section-3.3>
