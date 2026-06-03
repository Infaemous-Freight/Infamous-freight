# Organization Tenancy Blueprint

Updated: 2026-06-03

## Goal

Move INFÆMOUS FREIGHT from carrier-only tenancy to an enterprise model with organizations, memberships, roles, teams, and carrier relationships.

The active API already reads verified JWT tenant claims and resolves carrier membership before protected access. The next stage is to formalize the higher-level organization boundary while preserving current carrier-scoped freight operations.

## Target concepts

### Organization

Top-level tenant boundary for a company, broker team, carrier group, enterprise customer, or logistics operation.

Recommended fields:

- `id`
- `name`
- `slug`
- `status`
- `ownerUserId`
- `createdAt`
- `updatedAt`

### OrganizationMembership

User access record at the organization boundary.

Recommended fields:

- `id`
- `organizationId`
- `userId`
- `email`
- `name`
- `role`
- `status`
- `invitedAt`
- `acceptedAt`
- `createdAt`
- `updatedAt`

Recommended unique constraints:

- organization plus user id
- organization plus email

### OrganizationCarrier

Bridge between the enterprise tenant and one or more carriers.

Recommended fields:

- `id`
- `organizationId`
- `carrierId`
- `relationshipType`
- `status`
- `createdAt`

Recommended unique constraint:

- organization plus carrier

## Transition strategy

1. Keep `carrierId` as the operational freight boundary during transition.
2. Add organization tables first.
3. Backfill one organization per existing carrier.
4. Link every existing carrier through `OrganizationCarrier`.
5. Update auth context to resolve both `organizationId` and `carrierId`.
6. Add `organizationId` to operational tables only after API compatibility is verified.
7. Move RLS from carrier-only to organization-plus-carrier checks.

## JWT claim direction

Preferred trusted auth claims:

```json
{
  "sub": "auth-user-id",
  "app_metadata": {
    "organization_id": "org_xxx",
    "carrier_id": "carrier_xxx",
    "role": "owner"
  }
}
```

Temporary compatibility claims already supported by the API include tenant/carrier variants. Keep compatibility during migration, but make `organization_id` the long-term enterprise claim.

## RBAC direction

Recommended roles:

| Role | Scope | Purpose |
| --- | --- | --- |
| owner | organization | Full ownership and billing control |
| admin | organization | Admin operations and user management |
| dispatcher | carrier/team | Dispatch and load workflow access |
| sales | organization/carrier | Quote and customer intake access |
| accounting | organization/carrier | Billing, invoices, payments |
| safety | carrier/team | Compliance, HOS, documents |
| driver | assigned carrier/load | Driver workflow access |
| viewer | organization/carrier | Read-only access |

## Acceptance criteria

- Existing carrier-scoped routes continue to work.
- Every protected API request resolves a verified user, organization, carrier, and role.
- Users cannot access another organization's carriers, loads, drivers, invoices, documents, dispatch records, AI usage, or analytics.
- Billing ownership is organization-scoped.
- Audit logs capture organization and carrier context.
- RLS policies can be enabled without breaking legitimate requests.

## Prisma implementation direction

Add these models in a dedicated migration after staging review:

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String?  @unique
  status      String   @default("active")
  ownerUserId String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  memberships OrganizationMembership[]
  carriers    OrganizationCarrier[]

  @@index([status])
}

model OrganizationMembership {
  id             String    @id @default(cuid())
  organizationId String
  userId         String
  email          String
  name           String?
  role           String    @default("dispatcher")
  status         String    @default("active")
  invitedAt      DateTime  @default(now())
  acceptedAt     DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, userId])
  @@unique([organizationId, email])
  @@index([userId, status])
  @@index([organizationId, role, status])
}

model OrganizationCarrier {
  id               String   @id @default(cuid())
  organizationId   String
  carrierId        String
  relationshipType String   @default("owned")
  status           String   @default("active")
  createdAt        DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  carrier      Carrier      @relation(fields: [carrierId], references: [id])

  @@unique([organizationId, carrierId])
  @@index([organizationId, status])
  @@index([carrierId, status])
}
```
