# Infamous Freight Master Implementation Plan

## Purpose

This document converts the approved Infamous Freight growth recommendations into a contractor-ready execution plan for building the core freight operating platform.

Infamous Freight should operate as a technology-enabled logistics platform for shippers, carriers, brokers, dispatchers, and logistics teams. The platform should support quote intake, carrier onboarding, dispatch automation, shipment tracking, document handling, billing support, KPI visibility, and AI-assisted operations through the Genesis dispatcher assistant.

## Strategic Priorities

1. Genesis AI Dispatcher v1
2. Carrier Portal v1
3. Customer Portal v1
4. Automated Quote Intake
5. Real-Time Tracking Dashboard
6. Service expansion pages for FTL, LTL, Reefer, Flatbed, Heavy Haul, and Specialized Freight
7. KPI dashboard for revenue, operations, sales, and carrier network performance

## 90-Day Business Targets

| Area | Target |
| --- | --- |
| Active carriers | 150 total carriers |
| Shipper prospects | 100+ qualified prospects |
| Quote requests | 500+ quote submissions |
| Monthly revenue growth | 25% target increase |
| Repeat customers | 50+ repeat shippers |
| Workflow automation | 80%+ of quote/status/update workflows assisted by software |

## Service Expansion Priority

### Priority 1: Full Truckload (FTL)

FTL should remain the first expansion focus because it has the broadest demand, simplest operating motion, and strongest fit for carrier-network growth.

Target customer segments:

- Manufacturing
- Construction materials
- Retail distribution
- Food and beverage suppliers

90-day target:

- Increase FTL monthly volume by 25%.

### Priority 2: Reefer

Reefer freight should be the second expansion focus because it can produce stronger margins than dry van and supports recurring food, beverage, and pharmaceutical accounts.

Target customer segments:

- Grocery distributors
- Produce shippers
- Frozen food suppliers
- Pharmaceutical logistics customers

90-day target:

- Build a dedicated reefer carrier pool.
- Secure 5 to 10 recurring shipper accounts.

### Priority 3: Flatbed / Open Deck

Flatbed should be expanded after the core carrier workflows are stable.

Target customer segments:

- Steel suppliers
- Construction companies
- Equipment manufacturers
- Energy-sector customers

90-day target:

- Establish dedicated flatbed lanes.
- Activate at least 20 flatbed-capable carriers.

### Priority 4: Heavy Haul

Heavy haul should be handled as a specialized vertical after standard flatbed operations are mature.

Required capabilities:

- Permit management
- Escort coordination
- Oversized-load compliance
- Specialized-carrier vetting

### Priority 5: Hazmat / Specialized Freight

Hazmat and high-compliance specialized freight should not be scaled aggressively until core FTL, reefer, and flatbed operations are consistently profitable and compliance controls are implemented.

Required capabilities:

- Hazmat authority verification
- Insurance validation
- Driver certification validation
- Emergency-response documentation
- Strict document retention

## Sprint Roadmap

## Sprint 1: Revenue Foundation, Weeks 1-2

### Website Conversion Upgrade

Add or verify the following public pages and conversion paths:

- Homepage hero with strong Request a Freight Quote CTA
- Request Quote page
- Carrier Signup page
- Shipment Tracking page
- FTL service page
- LTL service page
- Reefer service page
- Flatbed service page
- Heavy Haul service page
- Specialized Freight page
- Why Infamous Freight section
- Customer reviews/testimonials section when legitimate testimonials are available

### Lead Capture Pipeline

Implement or configure CRM statuses:

1. New Lead
2. Contacted
3. Qualified
4. Quote Sent
5. Won
6. Lost
7. Repeat Customer

### Quote Intake Requirements

The quote form should capture:

- Customer name
- Company name
- Email
- Phone
- Pickup city/state/ZIP
- Delivery city/state/ZIP
- Pickup date
- Delivery date if known
- Freight type
- Equipment type
- Weight
- Dimensions
- Commodity
- Hazmat status
- Temperature requirements
- Special instructions
- File attachments where supported

### Quote Automation Rules

Quote intake should trigger:

- Lead record creation
- Quote request record creation
- Internal dispatcher notification
- Customer confirmation message
- Genesis quote-assist task
- KPI event logging

## Sprint 2: Carrier Network Expansion, Weeks 2-4

### Carrier Portal v1 Features

- Carrier registration
- MC/DOT number capture
- Insurance document upload
- W-9 upload
- Equipment profile
- Preferred lanes
- Contact verification
- Safety-rating review status
- Carrier approval status
- Load acceptance workflow

### Carrier Onboarding Verification

Minimum required fields and documents:

- Legal carrier name
- DBA if applicable
- MC number
- DOT number
- EIN or tax identifier where appropriate
- W-9
- Certificate of insurance
- Cargo insurance limit
- Auto liability limit
- Safety rating
- Operating authority status
- Primary contact
- Dispatch contact
- Remittance contact
- Equipment types
- Preferred lanes

### Carrier Targets

| Timeline | Cumulative Carrier Target |
| --- | --- |
| Day 30 | 50 total carriers |
| Day 60 | 100 total carriers |
| Day 90 | 150 total carriers |

## Sprint 3: Customer Portal, Weeks 4-6

### Customer Portal v1 Features

- Customer login
- Request quote
- View quotes
- Approve quote
- Track shipments
- View shipment events
- Retrieve PODs
- View invoices or billing references
- Create support tickets
- Message dispatch/support

### Customer Dashboard Widgets

- Open quotes
- Active shipments
- Delivered shipments
- Exceptions
- Documents pending
- Recent updates

## Sprint 4: Automation, Weeks 6-8

### Genesis AI Dispatcher v1

Genesis should assist with:

1. Quote request review
2. Missing-information detection
3. Rate guidance
4. Carrier matching
5. Dispatch notes
6. Customer status updates
7. Detention alerts
8. Exception summarization
9. Follow-up reminders
10. KPI event summaries

### Genesis Workflow

```text
Quote Request
→ Data Validation
→ Rate Guidance
→ Carrier Match
→ Dispatcher Review
→ Customer Quote
→ Load Creation
→ Dispatch
→ Tracking Updates
→ POD Collection
→ Invoice/Billing Handoff
```

### Genesis Guardrails

Genesis must not:

- Book freight without human approval unless explicitly enabled later.
- Send binding rate confirmations without dispatcher approval.
- Change bank/payment details.
- Approve carriers without compliance verification.
- Make legal, insurance, or compliance guarantees.

Genesis should always:

- Log recommendations.
- Mark confidence level.
- Identify missing data.
- Provide human-review checkpoints.

## Sprint 5: Reefer Division, Weeks 8-10

### Reefer Buildout

- Add reefer-specific quote fields.
- Track temperature requirements.
- Capture continuous vs start/stop requirements.
- Add reefer carrier equipment profile.
- Add food/pharma customer lead lists.

### Reefer KPIs

- Reefer quote requests
- Reefer booked loads
- Reefer margin
- Temperature exception count
- On-time pickup and delivery

## Sprint 6: Flatbed Division, Weeks 10-12

### Flatbed Buildout

- Add flatbed-specific quote fields.
- Capture tarp requirements.
- Capture load dimensions.
- Capture oversize indicators.
- Capture crane/forklift requirements.
- Build flatbed carrier pool.

### Flatbed KPIs

- Flatbed quote requests
- Flatbed booked loads
- Average revenue per load
- Carrier acceptance rate
- Securement/accessorial issues

## Sprint 7: Business Intelligence

### Executive KPI Dashboard

Revenue metrics:

- Monthly revenue
- Gross margin
- Revenue by service type
- Revenue by customer
- Revenue by lane
- Accessorial revenue

Operations metrics:

- Loads booked
- Loads delivered
- On-time pickup percentage
- On-time delivery percentage
- Active shipments
- Exceptions
- Detention events

Sales metrics:

- New leads
- Qualified leads
- Quotes sent
- Quote conversion rate
- New shippers
- Repeat shippers

Carrier metrics:

- Active carriers
- Approved carriers
- Pending carriers
- Carrier retention
- Carrier acceptance rate
- Safety/compliance review status

## Data Model Recommendations

Core tables or models should include:

- organizations
- users
- memberships
- customers
- carriers
- carrier_documents
- carrier_equipment
- carrier_lanes
- quote_requests
- quotes
- loads
- shipments
- shipment_events
- documents
- invoices
- detention_events
- ai_tasks
- audit_logs

## API Endpoint Recommendations

### Public

- POST /api/public/quote-requests
- GET /api/public/shipments/:trackingNumber
- POST /api/public/carrier-applications

### Authenticated Customer

- GET /api/customer/quotes
- POST /api/customer/quotes
- GET /api/customer/shipments
- GET /api/customer/shipments/:id
- GET /api/customer/documents
- POST /api/customer/support-tickets

### Authenticated Carrier

- GET /api/carrier/profile
- PUT /api/carrier/profile
- POST /api/carrier/documents
- GET /api/carrier/loads
- POST /api/carrier/loads/:id/accept
- POST /api/carrier/loads/:id/decline
- POST /api/carrier/shipments/:id/events
- POST /api/carrier/shipments/:id/pod

### Internal Operations

- GET /api/ops/dashboard
- GET /api/ops/quotes
- POST /api/ops/quotes/:id/approve
- GET /api/ops/loads
- POST /api/ops/loads
- PUT /api/ops/loads/:id
- GET /api/ops/carriers
- POST /api/ops/carriers/:id/approve
- POST /api/ops/carriers/:id/reject

### Genesis AI

- POST /api/ai/tasks
- GET /api/ai/tasks
- POST /api/ai/quote-assist
- POST /api/ai/carrier-match
- POST /api/ai/status-summary
- POST /api/ai/detention-review

## Detention Fee SOP

### Definition

Detention occurs when a driver/carrier is delayed beyond the agreed free time at pickup or delivery.

### Required Documentation

- Shipment/load ID
- Carrier name
- Driver name if available
- Facility name
- Appointment time
- Arrival time
- Check-in proof if available
- Loading/unloading start time
- Loading/unloading completion time
- Departure time
- Delay reason
- Written facility/customer notes if available

### Procedure

1. Carrier or dispatcher logs delay.
2. System starts detention timer after free time expires.
3. Dispatcher notifies customer/shipper.
4. Genesis drafts detention summary.
5. Dispatcher reviews and approves detention fee.
6. Detention event is added to billing/invoice workflow.
7. Weekly report tracks detention revenue and disputes.

### Customer Notice Language

Use clear, professional language:

```text
This shipment has exceeded the agreed free time at the facility. Detention time is now being tracked according to the applicable agreement. Please confirm loading/unloading status and expected release time so we can minimize additional charges and keep all parties updated.
```

## Budget Approval Gates

No spending should occur without approval gates.

### Approved Without Additional Spend

- Recruiting pipeline setup
- Vendor demos
- Carrier prospect list building
- SOP refinement
- KPI dashboard setup

### Requires Approval

- Software contracts
- Job offers
- Carrier incentives
- Paid marketing
- External consultants
- Compliance service contracts

## Week 2 Approval Packet Requirements

Before authorizing Week 2 spend, prepare:

1. Vendor comparison with pricing, features, setup fees, contract terms, cancellation terms, and implementation timeline.
2. Sales representative compensation plan with base, commission, quota, and expected ROI.
3. Carrier onboarding compliance checklist.
4. Detention SOP with documentation rules and shipper notice language.
5. KPI dashboard mockup with baseline numbers.

## Recommended Engineering Task Breakdown

### Epic 1: Public Revenue Capture

- Build/verify service pages.
- Improve Request Quote CTA.
- Add quote request form validation.
- Add public tracking page.
- Add carrier signup page.

### Epic 2: Carrier Portal

- Add carrier profile model.
- Add document upload flow.
- Add onboarding status tracking.
- Add equipment and lane profiles.
- Add carrier approval workflow.

### Epic 3: Customer Portal

- Add customer dashboard.
- Add quote list and quote detail screens.
- Add shipment tracking view.
- Add documents/POD view.
- Add support ticket flow.

### Epic 4: Genesis AI Dispatcher

- Add ai_tasks table or equivalent model.
- Add quote-assist workflow.
- Add carrier-match workflow.
- Add status-summary workflow.
- Add detention-review workflow.
- Add human approval checkpoints.

### Epic 5: BI Dashboard

- Add revenue metrics.
- Add operations metrics.
- Add sales metrics.
- Add carrier metrics.
- Add export/reporting support.

## Acceptance Criteria

The platform build should be considered successful when:

- Shippers can request quotes from the website.
- Carriers can submit onboarding information and documents.
- Internal users can review quote requests and carrier applications.
- Customers can track shipments by tracking number.
- Genesis can summarize quote requests and recommend next actions.
- Shipment events are visible in an operations dashboard.
- KPI dashboard shows baseline and current performance.
- Spending controls are documented and enforced outside the application workflow.

## Immediate Next Steps

1. Convert this document into GitHub issues by epic.
2. Confirm current schema and frontend routes.
3. Implement missing database migrations.
4. Build public quote, tracking, and carrier signup conversion paths.
5. Build Genesis v1 around quote assist and carrier matching.
6. Add dashboard KPIs once data capture is reliable.

## Notes

This plan is designed to support execution without authorizing real-world spending, hiring, banking, or contract commitments from inside the software workflow. Any real spend, hiring, banking, insurance, or compliance decision must be reviewed and approved by the business owner or authorized operator.
