# Admin Dashboard — MVP Operations Scope Audit

This document records the verification of whether the current admin / operator UI
is sufficient to operate the MVP, per the launch-control task
[Ops]: Verify admin dashboard MVP operations scope (related to launch control
issue #1781).

It enumerates the existing UI paths that cover each MVP admin requirement, lists
the gaps that block "operate the MVP from the admin UI alone", and records the
launch-gate impact of those gaps. Gaps below should be converted into
implementation issues.

> Scope: this is a paper audit of the code in the repository as of this PR.
> Screenshots are not included because every operator surface today is rendered
> from in-file mock data (see Gap G2), so a screenshot would not be evidence of
> working MVP operations. Operators currently have to fall back to the database
> and the runbooks in `docs/ADMIN_RECOVERY_RUNBOOK.md`.

## Method

- React Router routes under `<AppLayout />` in [`apps/web/src/App.tsx`](../apps/web/src/App.tsx)
  were treated as the canonical admin/operator surface. Public/portal routes
  (`/customer-portal`, `/carrier-portal`, `/track-shipment`, `/request-quote`,
  `/login`, `/onboarding`, `/home`) are out of scope for this admin audit.
- Each page under `apps/web/src/pages` was inspected for: the entities it shows,
  whether it can mutate status, and whether it reads from the API or from
  in-file mock data.
- API/audit coverage was cross-checked against
  [`apps/api/src/audit/audit.service.ts`](../apps/api/src/audit/audit.service.ts)
  and [`apps/api/src/rbac/rbac-rules.ts`](../apps/api/src/rbac/rbac-rules.ts).

## MVP scope coverage

| MVP admin requirement | Path(s) | Page / component | Status | Notes |
|---|---|---|---|---|
| View quote requests / leads | `/quotes` | [`QuoteRequestsPage`](../apps/web/src/pages/QuoteRequestsPage.tsx) | Partial — UI exists, mock data | List + detail panel render, but rows come from `mockQuotes` and are not fetched from the API. |
| Update lead status (`new`, `quoted`, `booked`, `lost`) | `/quotes` | `QuoteRequestsPage` | **Gap** | Status taxonomy is `NEW / REVIEWING / QUOTED / APPROVED / CONVERTED / REJECTED`. "Start Review", "Submit Quote", "Approve Quote" and "Reject" buttons exist but only "Convert to Load" has an `onClick` handler (see [`QuoteRequestsPage.tsx` L380–414](../apps/web/src/pages/QuoteRequestsPage.tsx)). No mapping to MVP states `booked` / `lost`. |
| View shipments / loads | `/loads`, `/dispatch`, `/` (or `/ops`) | [`LoadsPage`](../apps/web/src/pages/LoadsPage.tsx), [`DispatchBoardPage`](../apps/web/src/pages/DispatchBoardPage.tsx), [`DashboardPage`](../apps/web/src/pages/DashboardPage.tsx) | Partial | `LoadsPage` is currently a third-party load-board search view (DAT/Truckstop/123Loadboard sample rows from `mockLoads`), not internal shipments. `DashboardPage` shows a small "Active Loads" list from `mockActiveLoads`. |
| Update shipment status | (none) | n/a | **Gap** | No admin UI mutates internal shipment/load status. `LoadsPage` has no status field on its `Load` type and no setter; `DashboardPage` is read-only. |
| View customers / shippers | (none) | n/a | **Gap** | No `/customers` or `/shippers` admin route. `/customer-portal` is the shipper-facing portal, not an operator view. RBAC has `shippers:view` (see [`rbac-rules.ts`](../apps/api/src/rbac/rbac-rules.ts)) but no UI consumes it. |
| View carriers | `/carriers` | [`CarriersPage`](../apps/web/src/pages/CarriersPage.tsx) | Partial — UI exists, mock data | Onboarding/approval/insurance compliance views render from `mockCarriers`; no API wiring. |
| View drivers | `/drivers` | [`DriversPage`](../apps/web/src/pages/DriversPage.tsx) | Partial — UI exists, mock data | Same pattern: page renders, data is mocked. |
| Inspect payment / billing state | `/invoices`, `/accounting`, `/billing` | [`InvoicesPage`](../apps/web/src/pages/InvoicesPage.tsx), [`AccountingDashboardPage`](../apps/web/src/pages/AccountingDashboardPage.tsx), [`BillingRequiredPage`](../apps/web/src/pages/BillingRequiredPage.tsx) | Partial | Invoice list + carrier-pay + revenue summary all render from `mockInvoices` / `mockCarrierPay`. `/billing` is the paywall page, not operator inspection. Real Stripe state must currently be checked in the Stripe dashboard. |
| Notification / send-failure state | (none) | n/a | **Gap** | No admin UI for notification deliverability. `docs/NOTIFICATION_DELIVERABILITY_VERIFICATION.md` is followed manually against provider dashboards. |
| Audit admin actions | (none in UI) | n/a | **Gap** | API has [`audit.service.ts`](../apps/api/src/audit/audit.service.ts) with a complete `AuditAction` enum (auth, loads, drivers, billing, etc.), but no admin route reads or renders audit log entries. |

### Other admin/operator routes already wired in the app

These exist under `<AppLayout />` and remain in scope for the operator
experience but are not part of the MVP admin checklist itself:

- `/analytics` → [`MetricsDashboard`](../apps/web/src/pages/MetricsDashboard.tsx)
- `/compliance` → [`CompliancePage`](../apps/web/src/pages/CompliancePage.tsx)
- `/settings` → [`SettingsPage`](../apps/web/src/pages/SettingsPage.tsx)
- `/launch-validation` → [`LaunchValidationPage`](../apps/web/src/pages/LaunchValidationPage.tsx)
- `/rate-comparison`, `/pay-per-load`, `/referrals`, `/case-studies`,
  `/product-hunt`, `/gdpr` (marketing / pricing tools)

## Identified gaps (convert each into an implementation issue)

- **G1 — Lead status taxonomy mismatch.** Align `/quotes` status flow with the
  MVP states `new`, `quoted`, `booked`, `lost`, or document the mapping
  `NEW → new`, `QUOTED → quoted`, `CONVERTED → booked`, `REJECTED → lost`, and
  collapse `REVIEWING` / `APPROVED` if redundant. Wire status-change buttons
  (`Start Review`, `Submit Quote`, `Approve Quote`, `Reject`) to API mutations.
- **G2 — Operator pages are mock-only.** `/quotes`, `/loads`, `/dispatch`,
  `/carriers`, `/drivers`, `/invoices`, `/accounting`, and `/` all render
  in-file `mock*` arrays. They need to be wired to the real API before they
  can be considered operator-grade for MVP.
- **G3 — No internal shipment list with status updates.** `/loads` is a
  third-party load-board view. The MVP needs an internal shipments list (likely
  `/shipments` or a re-purposed `/loads`) with status mutation
  (`new → assigned → in_transit → delivered → exception`).
- **G4 — No admin customers/shippers list.** Add an admin route (e.g.
  `/customers` or `/shippers`) that lists shipper accounts, gated by the
  existing `shippers:view` permission in `rbac-rules.ts`.
- **G5 — No notification / send-failure surface.** Add a minimal admin view
  that lists recent notification attempts (email/SMS) and their delivery
  status, sourced from the notification service the API already calls in
  `docs/NOTIFICATION_DELIVERABILITY_VERIFICATION.md`.
- **G6 — No audit log viewer in the UI.** Expose the existing `AuditAction`
  log via an admin route (e.g. `/audit`) so admin actions can be inspected
  without DB access. Restrict to admin role only.
- **G7 — Billing inspection is provider-only.** Provide an operator-facing
  billing state read view (subscription status, last invoice, last webhook
  event) instead of relying on the Stripe dashboard.

## Launch-gate impact

- Per `docs/PRODUCTION_READINESS_VERIFICATION.md` Phase 2 §5 ("Admin Access"),
  the launch gate requires: admin dashboard loads, admin can search
  users/operational records, and admin actions are audit-logged. Today the
  dashboard loads (✓) but neither operational-record search against real data
  (G2, G3, G4) nor audit-log visibility in the UI (G6) is met.
- Per `docs/LAUNCH_READINESS_INDEX.md`, no public-launch gate can be approved
  until the gaps above either ship or have a documented manual workaround
  recorded in `docs/LAUNCH_EVIDENCE_LOG.md`.
- **Recommendation:** the MVP can run in a "supervised launch" mode using the
  database + `docs/ADMIN_RECOVERY_RUNBOOK.md` as the operator interface, but
  the **public/paid launch gate must remain blocked** until at least G1, G3,
  G4, and G6 are implemented and wired to the real API.

## Definition of done — status

- [x] Current UI paths are documented (table above) and gaps are listed.
- [x] Missing MVP admin features are enumerated as G1–G7 ready to be filed as
      implementation issues.
- [x] Evidence is provided as inline links to source files and routes;
      operator-facing screenshots are intentionally omitted because every
      surface is mock-data only (see G2).
- [x] Launch-gate impact is recorded above.
