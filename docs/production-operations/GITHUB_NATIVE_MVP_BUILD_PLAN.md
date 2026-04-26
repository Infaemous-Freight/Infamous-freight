# GitHub-Native MVP Build Plan

This plan keeps Infamous Freight focused on the core freight operating loop before expanding into advanced automation.

## Operating Loop

```text
Quote Request -> Quote Review -> Load Creation -> Carrier Assignment -> Dispatch -> Tracking -> POD Upload -> Invoice
```

## Phase 1: Core Operations

Build and verify these first:

1. Shipper quote request intake
2. Quote review dashboard
3. Carrier database
4. Carrier approval status
5. Load creation
6. Dispatch board
7. Tracking updates
8. POD upload
9. Invoice generation

Do not prioritize advanced AI, ELD integrations, factoring integrations, or payroll until this loop works end to end.

## Phase 2: Compliance Gate

Production readiness must remain blocked until evidence exists for:

- Legal entity
- EIN
- FMCSA broker authority
- BOC-3
- BMC-84 or BMC-85
- Carrier packet workflow
- Document retention workflow

Use `docs/production-operations/PRODUCTION_READINESS_EVIDENCE.md` as the evidence source of truth.

## Phase 3: External Portals

Add external access only after internal operations are stable:

- Shipper portal
- Carrier portal
- Driver update page
- Tracking lookup page

External access adds security risk. Internal control comes first.

## Phase 4: Automations

Add automations after workflows are stable:

- Quote request alerts
- Carrier document reminders
- Insurance expiration reminders
- Stale load update alerts
- Missing POD reminders
- Overdue invoice alerts
- Exception alerts

Automation should reinforce a working workflow, not cover up a broken one.

## Required Business Rules

- Only approved carriers can be assigned to loads.
- A carrier cannot be approved without W-9, insurance, and agreement.
- A load cannot close without POD.
- An invoice cannot be sent without POD.
- Customers cannot see internal notes.
- Carriers cannot see financial margin.
- Drivers cannot see customer or billing details.
- Production readiness stays blocked until compliance evidence is verified.

## Required Data Objects

- Shippers
- Quote Requests
- Carriers
- Loads
- Tracking Updates
- Documents
- Invoices
- Compliance Evidence
- Users and Roles

## First Dashboards to Prioritize

### Operations Dashboard

- Open quotes
- Active loads
- Loads in exception
- Missing PODs
- Overdue invoices
- Blocked compliance items

### Dispatch Board

- Pending
- Assigned
- Dispatched
- At Pickup
- Loaded
- In Transit
- At Delivery
- Delivered
- POD Received
- Exception

### Carrier Management Dashboard

- Pending carriers
- Approved carriers
- Needs documents
- Expiring insurance
- Rejected carriers

### Accounting Dashboard

- Draft invoices
- Sent invoices
- Overdue invoices
- Paid invoices
- Gross margin
- Carrier pay pending

## Security Requirements

Role boundaries must be tested before launch.

| Role | Access |
|---|---|
| Admin | Everything |
| Dispatcher | Loads, tracking, carriers, documents |
| Sales | Shippers and quote requests |
| Carrier Manager | Carriers and carrier documents |
| Accounting | Invoices and PODs |
| Shipper | Own quotes, own loads, customer-visible tracking |
| Carrier | Own profile and assigned loads |
| Driver | Assigned tracking updates only |

External users must not see:

- Carrier rate
- Shipper rate
- Gross margin
- Internal notes
- Other customer records
- Other carrier records
- Compliance evidence
- Admin settings

## MVP Test Checklist

1. Submit quote request.
2. Convert quote to load.
3. Submit carrier application.
4. Upload carrier documents.
5. Approve carrier.
6. Assign carrier to load.
7. Move load through dispatch statuses.
8. Submit tracking update.
9. Confirm shipper sees only customer-visible tracking.
10. Upload POD.
11. Generate invoice.
12. Confirm gross margin calculates correctly.
13. Confirm restricted roles cannot see unauthorized data.
14. Confirm production readiness remains blocked until evidence is verified.

## Success Criteria

The platform is useful when it can answer these questions at all times:

- What freight needs attention?
- Which carrier is responsible?
- Where is the shipment?
- What document is missing?
- Has the money been invoiced and collected?
