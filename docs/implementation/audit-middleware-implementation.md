# Audit Middleware Implementation Spec

Updated: 2026-06-03

## Objective

Make audit logging automatic for every production-significant API mutation in INFÆMOUS FREIGHT.

The repository already has an `AuditLog` Prisma model and audit logger wiring. The remaining work is to standardize what gets logged, where the middleware attaches, and which route groups require audit coverage.

## Required audit fields

Every mutation audit entry should capture:

| Field | Source | Required |
| --- | --- | --- |
| `entityType` | route/resource name | yes |
| `entityId` | created/updated/deleted record id | yes when available |
| `action` | normalized action enum | yes |
| `userId` | trusted auth context | yes |
| `userName` | role/email fallback | yes |
| `carrierId` | tenant context | yes for private freight records |
| `organizationId` | org context after migration | yes after org rollout |
| `requestId` | request middleware | yes |
| `ipAddress` | request IP / forwarded IP | yes |
| `metadata` | safe JSON payload summary | optional |
| `createdAt` | database default | yes |

## Action names

Use stable uppercase action names so analytics and compliance can group them safely.

Recommended actions:

- `LOAD_CREATED`
- `LOAD_UPDATED`
- `LOAD_ASSIGNED`
- `LOAD_DISPATCHED`
- `LOAD_STATUS_CHANGED`
- `DRIVER_CREATED`
- `DRIVER_UPDATED`
- `DRIVER_STATUS_CHANGED`
- `SHIPMENT_TRACKING_UPDATED`
- `QUOTE_CREATED`
- `QUOTE_UPDATED`
- `INVOICE_CREATED`
- `INVOICE_UPDATED`
- `INVOICE_PAID`
- `PAYMENT_RECORDED`
- `DOCUMENT_UPLOADED`
- `DOCUMENT_VERIFIED`
- `TEAM_MEMBER_INVITED`
- `TEAM_MEMBER_ROLE_CHANGED`
- `BILLING_PORTAL_OPENED`
- `CHECKOUT_SESSION_CREATED`
- `DISPATCH_INCIDENT_CREATED`
- `DISPATCH_INCIDENT_RESOLVED`
- `SLA_TIMER_CREATED`
- `SLA_TIMER_COMPLETED`
- `AI_ACTION_REQUESTED`

## Middleware design

Create a helper that wraps mutation handlers:

```ts
export function auditedMutation(options: {
  entityType: string;
  action: string;
  getEntityId?: (result: unknown, req: Request) => string | null;
  getMetadata?: (result: unknown, req: Request) => Record<string, unknown> | null;
}) {
  return async function writeAudit(req: Request, result: unknown) {
    const user = getAuditUser(req);
    await auditLogger.log({
      entityType: options.entityType,
      entityId: options.getEntityId?.(result, req) ?? 'unknown',
      action: options.action,
      userId: user.userId,
      userName: user.userName,
      details: JSON.stringify({
        carrierId: req.tenantId,
        requestId: req.requestId,
        metadata: options.getMetadata?.(result, req) ?? undefined,
      }),
    });
  };
}
```

## Route coverage

Audit these route groups first:

| Route group | Actions |
| --- | --- |
| Loads | create, update, assign, dispatch, status change |
| Drivers | create, update, status change, location update |
| Shipment tracking | update, delivered, POD received |
| Quotes | create, update, accept/reject |
| Invoices | create, update, mark paid |
| Payments | create/update payment record |
| Documents | upload, verify, expire |
| Team members | invite, accept, role change, deactivate |
| Billing | checkout session, portal session, webhook sync |
| Dispatch automation | incident create/resolve, alert create, SLA timer create/complete |
| AI | AI dispatch recommendation/action request |

## Sensitive data rules

Do not log:

- raw JWTs
- Stripe secrets
- full payment methods
- passwords
- Supabase service keys
- private document contents
- complete request bodies containing PII

Log safe metadata only, such as record ids, status changes, counts, and high-level action context.

## Database migration direction

Upgrade the `AuditLog` model later with:

```prisma
carrierId      String?
organizationId String?
requestId      String?
ipAddress      String?
metadata       Json?
```

Until then, encode safe structured metadata inside `details`.

## Tests

Add regression tests that verify:

1. A load create mutation writes an audit row.
2. A driver update mutation writes an audit row.
3. A billing checkout action writes an audit row.
4. A dispatch incident creation writes an audit row.
5. Audit entries include tenant/request context.
6. Sensitive headers are not persisted.

## Production gate

Do not mark auditability complete until mutation audit coverage is verified by automated tests and at least one controlled production smoke test.