# Infamous Freight Execution Backlog

This backlog turns the Infamous Freight master implementation plan into developer-ready work.

## Enabled Workstreams

1. Public website conversion
2. Carrier portal
3. Customer portal
4. Genesis AI dispatcher
5. Shipment tracking dashboard
6. KPI dashboard
7. Detention workflow
8. Reefer freight support
9. Flatbed freight support
10. Audit logging and access controls

## Workstream 1: Public Website Conversion

Goal: make it easy for shippers and carriers to take action.

Tasks:
- Add or verify service pages for FTL, LTL, Reefer, Flatbed, Heavy Haul, and Specialized Freight.
- Add strong Request a Freight Quote and Become a Carrier calls to action.
- Add or verify quote request, carrier signup, and shipment tracking pages.
- Capture pickup, delivery, freight type, equipment, weight, dimensions, commodity, temperature needs, and special instructions.
- Route submissions into the current intake workflow.

Acceptance criteria:
- A shipper can request a quote without logging in.
- A carrier can begin onboarding without logging in.
- A customer can track by tracking number.

## Workstream 2: Carrier Portal

Goal: let carriers submit and manage onboarding details.

Tasks:
- Build registration flow.
- Capture authority identifiers, equipment, lanes, and contacts.
- Add document upload placeholders.
- Add review status and carrier status.
- Add load acceptance workflow.

Acceptance criteria:
- Carriers can submit profile details.
- Internal users can review carrier profiles.
- Carrier status supports pending, approved, rejected, and suspended.

## Workstream 3: Customer Portal

Goal: give shippers a dashboard for quotes, shipments, documents, and support.

Tasks:
- Build customer dashboard.
- Add quote list and quote detail views.
- Add shipment list and tracking detail views.
- Add document view.
- Add support ticket creation.

Acceptance criteria:
- Customers can view quotes and shipments.
- Customers can track shipment status.
- Customers can access available shipment documents.

## Workstream 4: Genesis AI Dispatcher

Goal: create a safe first version of Genesis for quote assistance, carrier matching, and shipment summaries.

Tasks:
- Add AI task model if missing.
- Add quote assist workflow.
- Add carrier match workflow.
- Add status summary workflow.
- Add detention review workflow.
- Add confidence score and human review status.
- Log all Genesis recommendations.

Acceptance criteria:
- Genesis summarizes quote requests.
- Genesis identifies missing data.
- Genesis recommends carrier matches.
- Genesis drafts status updates.
- Human review remains required for final operational action.

## Workstream 5: Shipment Tracking Dashboard

Goal: give operations users visibility into shipments and exceptions.

Tasks:
- Add active shipment dashboard.
- Add shipment event timeline.
- Add exception queue.
- Add detention alert visibility.
- Add filters by status, customer, carrier, lane, and priority.

Acceptance criteria:
- Active shipments are visible.
- Shipment events appear in chronological order.
- Exceptions are easy to find.

## Workstream 6: KPI Dashboard

Goal: track revenue, operations, sales, and carrier performance.

Tasks:
- Add revenue metrics.
- Add gross margin metrics.
- Add revenue by service type.
- Add loads booked and delivered.
- Add on-time pickup and delivery percentages.
- Add quote conversion rate.
- Add shipper and carrier counts.

Acceptance criteria:
- Dashboard shows baseline and current performance.
- Metrics are grouped by business area.
- Data refresh does not require manual spreadsheets.

## Workstream 7: Detention Workflow

Goal: document and manage detention events consistently.

Tasks:
- Add detention event model if missing.
- Capture appointment, arrival, start, end, departure, and delay reason.
- Add free-time tracking.
- Add customer notice workflow.
- Add weekly detention report.

Acceptance criteria:
- Detention can be documented consistently.
- Notices can be generated professionally.
- Detention activity can be reported weekly.

## Workstream 8: Reefer Freight Support

Goal: support temperature-controlled freight.

Tasks:
- Add temperature fields to quote flow.
- Capture continuous versus start-stop requirements.
- Capture commodity sensitivity.
- Add reefer equipment profile fields.
- Add reefer performance metrics.

Acceptance criteria:
- Reefer quote requests capture temperature requirements.
- Reefer-capable carriers can be identified.

## Workstream 9: Flatbed Freight Support

Goal: support flatbed and open deck freight.

Tasks:
- Add tarp requirement fields.
- Capture dimensions and oversize indicators.
- Capture crane or forklift needs.
- Add securement notes.
- Add flatbed equipment profile fields.

Acceptance criteria:
- Flatbed quote requests capture operational requirements.
- Flatbed-capable carriers can be identified.

## Workstream 10: Audit Logging and Access Controls

Goal: improve control over important operational actions.

Tasks:
- Add audit logging for key actions.
- Log carrier review decisions.
- Log quote approvals.
- Log shipment status changes.
- Log document uploads and review status.
- Add role-based controls for internal operations.

Acceptance criteria:
- Important actions are auditable.
- Only authorized users can approve carriers, quotes, and dispatch actions.
- Sensitive operational changes require review.

## Immediate Development Order

1. Public quote intake and tracking
2. Carrier signup and review
3. Customer dashboard
4. Genesis quote assist
5. Shipment event dashboard
6. KPI reporting

## Definition of Done

Each task is complete only when code is committed, verification steps are documented, user-facing copy is reviewed, environment variables are documented if needed, and deployment impact is clear.
