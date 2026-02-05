# Data Governance Policy

**Scope**: Infæmous Freight Enterprises platform data (loads, dispatch,
messages, documents, billing, AI actions).

## Ownership & Agency

- All operational data belongs to the customer company.
- Users act as authorized agents of their company.
- The platform operates as a data processor on behalf of the company.

## Administrative Controls

Company admins can:

- Export all company data.
- Delete company data.
- Revoke user access at any time.

## Access & Isolation

- Company-scoped data is enforced via row-level security (RLS).
- Role-based access control (RBAC) ensures least-privilege access.
- All access and changes are captured in immutable audit logs.

## Data Deletion & Export

- Data deletion and export requests are fulfilled per customer instructions.
- Exports are delivered in standard machine-readable formats.

## Sub-Processors

Infæmous Freight Enterprises uses vetted sub-processors (e.g., Supabase, Stripe,
cloud providers) under contractual and security controls.
