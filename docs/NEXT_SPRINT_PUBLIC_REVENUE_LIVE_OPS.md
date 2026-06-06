# Next Sprint: Public Revenue + Live Ops Foundation

## Goal

Move Infamous Freight from demo-ready toward business-usable by validating public intake/tracking and wiring the first internal operations routes to live data.

## Sprint Outcomes

By the end of this sprint:

1. Public quote intake is verified end-to-end.
2. Public tracking has one known-safe positive lookup record for validation.
3. `/quotes` uses live API-backed records for core quote workflows.
4. `/loads` uses live API-backed records for core load workflows.
5. `/dispatch` uses live API-backed records for core dispatch workflows.
6. Genesis quote assist exists as a review-only assistant.
7. Launch evidence is captured after production checks.

## Priority 1: Public Quote Intake Verification

### Tasks

- Submit a production quote request from the live website.
- Confirm the frontend request succeeds.
- Confirm the API receives the request.
- Confirm the quote/contact record is stored or routed to the configured intake system.
- Confirm internal notification behavior.
- Confirm customer confirmation behavior.
- Record proof in launch evidence notes.

### Acceptance Criteria

- A shipper can submit a quote request without logging in.
- The request is visible to the internal team or configured intake destination.
- The customer receives confirmation or the UI clearly confirms receipt.
- Evidence is documented.

## Priority 2: Safe Public Tracking Validation

### Tasks

- Create or identify one known-safe tracking record for production validation.
- Ensure the public payload excludes sensitive customer, carrier, rate, and document data.
- Validate malformed tracking number behavior.
- Validate unknown tracking number behavior.
- Validate known-safe positive lookup behavior.
- Record proof in launch evidence notes.

### Safe Public Payload Fields

Recommended public fields:

- trackingNumber
- publicStatus
- originCity
- originState
- destinationCity
- destinationState
- lastUpdatedAt
- shipmentEvents with public-safe descriptions only

### Acceptance Criteria

- Positive lookup works for a known-safe tracking number.
- Unknown lookup fails safely.
- Malformed lookup fails safely.
- No sensitive data is exposed.

## Priority 3: Wire `/quotes` to Live API Data

### Tasks

- Identify current demo data source for `/quotes`.
- Add or verify API endpoint for listing quotes.
- Add or verify API endpoint for quote detail.
- Replace demo records with live service calls.
- Add loading, empty, and error states.
- Add tenant-aware filtering.
- Add verification notes.

### Acceptance Criteria

- `/quotes` displays API-backed quote records.
- Empty state appears when no quotes exist.
- Errors are handled clearly.
- Demo data is not used for production quote records.

## Priority 4: Wire `/loads` to Live API Data

### Tasks

- Identify current demo data source for `/loads`.
- Add or verify API endpoint for listing loads.
- Add or verify API endpoint for load detail.
- Replace demo records with live service calls.
- Add loading, empty, and error states.
- Add tenant-aware filtering.
- Add verification notes.

### Acceptance Criteria

- `/loads` displays API-backed load records.
- Empty state appears when no loads exist.
- Errors are handled clearly.
- Demo data is not used for production load records.

## Priority 5: Wire `/dispatch` to Live API Data

### Tasks

- Identify current demo data source for `/dispatch`.
- Add or verify dispatch API endpoints.
- Display active loads or shipments from live data.
- Display shipment event timeline from live data where available.
- Display operational exceptions from live data where available.
- Add loading, empty, and error states.
- Add tenant-aware filtering.
- Add verification notes.

### Acceptance Criteria

- `/dispatch` displays live operations data.
- Shipment or load status updates are visible.
- Exceptions are visible when present.
- Demo data is not used for production dispatch records.

## Priority 6: Genesis Quote Assist v1

### Tasks

- Add review-only quote assist workflow.
- Summarize quote request details.
- Identify missing pickup, delivery, equipment, commodity, dimensions, weight, temperature, hazmat, or date details.
- Recommend internal next actions.
- Add confidence score.
- Log recommendation output.
- Require human review before any customer-facing or operational action.

### Acceptance Criteria

- Genesis summarizes quote requests.
- Genesis identifies missing quote data.
- Genesis suggests next actions.
- Genesis does not send binding messages or execute operational changes.

## Priority 7: Launch Evidence Capture

### Tasks

- Run repository verification gates.
- Run production readiness checks.
- Capture public quote intake evidence.
- Capture public tracking evidence.
- Capture screenshots or logs as appropriate.
- Record release notes.

### Repository Gates

```bash
pnpm run lint
pnpm run typecheck
pnpm run prisma:validate
pnpm run build
pnpm run test
```

### Production Checks

```bash
pnpm run env:check:strict
pnpm run production:preflight
pnpm run production:smoke-test
pnpm run production:capture-netlify-evidence
```

Run billing verification when billing code or Stripe configuration changes:

```bash
pnpm run billing:verify-live
```

## Out of Scope for This Sprint

- Driver mobile app public release
- Live messaging release
- Fully autonomous AI dispatch
- Heavy haul permit automation
- Hazmat automation
- Paid marketing launch

## Developer Notes

- Keep `/messages` and `/driver-app` gated until explicitly production-ready.
- Keep Genesis review-only until audit logging and approval controls are mature.
- Public tracking responses must remain minimal and safe.
- Do not approve launch solely from documentation; use credential-backed checks and captured evidence.
