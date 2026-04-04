# Freight Intake and Dispatch Workflow (Small Logistics Company)

## Goals
- Standardize order intake, planning, dispatch, execution, and invoicing.
- Reduce manual data entry and missed updates.
- Improve on-time pickup/delivery and margin visibility.

## End-to-End Workflow

### 1) Lead / Quote Intake
**Inputs:** shipper email, web form, phone call, EDI/API tender.

**Steps:**
1. Capture shipper profile (company, contacts, billing terms).
2. Capture shipment request:
   - origin / destination
   - commodity + hazmat flags
   - weight, dimensions, pallet count
   - pickup/delivery windows
   - special requirements (liftgate, reefer, team driver)
3. Auto-validate required fields and geocode addresses.
4. Price load (rule-based + market benchmark).
5. Send quote and store quote expiration timestamp.

**Automation opportunities:**
- Email parsing + OCR for rate requests.
- API/EDI ingestion into a single intake queue.
- Auto-rating based on lane history, fuel, and accessorial rules.
- Quote follow-up reminders based on acceptance probability.

**Suggested tools:**
- Forms/CRM: HubSpot, Zoho CRM, or Airtable forms.
- EDI/API: Orderful, SPS Commerce, custom Express webhook endpoints.
- Geocoding/validation: Google Maps API, HERE.
- Rate intelligence: DAT, Truckstop, internal lane model.

---

### 2) Load Creation & Risk Checks
**Steps:**
1. Convert accepted quote to load record.
2. Assign tenant/customer ownership and permissions.
3. Verify compliance:
   - insurance limits
   - commodity restrictions
   - lane constraints
   - appointment requirements
4. Pre-calculate estimated margin and service risk score.

**Automation opportunities:**
- One-click quote-to-load conversion.
- Automatic compliance checklist generation.
- AI risk score (historical delay, weather, carrier performance).

**Suggested tools:**
- TMS core: Tailwind TMS, AscendTMS, or custom Node/TypeScript TMS.
- Rules engine: JSON rules + worker queue (BullMQ).
- Weather/risk feeds: OpenWeather + lane risk service.

---

### 3) Capacity Sourcing (Carrier/Driver Selection)
**Steps:**
1. Build candidate list from preferred carriers + available drivers.
2. Score options on cost, ETA reliability, and compliance.
3. Send digital tender to top candidate set.
4. Receive acceptance/rejection and lock assignment.

**Automation opportunities:**
- Auto-tender waterfall (try carrier A, then B, then load board).
- Carrier scorecard auto-update from pickup/delivery outcomes.
- Instant COI (certificate of insurance) verification.

**Suggested tools:**
- Load boards: DAT, Truckstop.
- Messaging: Twilio (SMS), SendGrid (email), WhatsApp API.
- Carrier onboarding/compliance: MyCarrierPortal, RMIS.

---

### 4) Dispatch Planning
**Steps:**
1. Create dispatch sheet: route, appointments, instructions, documents.
2. Optimize route + stop sequencing.
3. Issue rate confirmation and BOL package.
4. Collect driver acknowledgment.

**Automation opportunities:**
- Auto-generated dispatch packets.
- Route optimization with fuel/toll constraints.
- Geofence-based appointment alerts.

**Suggested tools:**
- Routing: OptimoRoute, Google Route Optimization.
- Document generation: PDFKit/DocuSign templates.
- Mobile app: Driver app with check calls + proof uploads.

---

### 5) In-Transit Execution & Exception Management
**Steps:**
1. Start tracking from ELD/GPS/mobile check-ins.
2. Trigger milestones: arrived pickup, loaded, in transit, delivered.
3. Detect exceptions: delay risk, missed appointment, temp excursions.
4. Auto-notify internal ops + customer.

**Automation opportunities:**
- Predictive ETA and delay alerts.
- AI-generated customer update messages.
- Incident workflow with root-cause tags.

**Suggested tools:**
- Visibility: project44, FourKites, Samsara, Motive.
- Alerting: Slack/Teams + PagerDuty for critical exceptions.
- Workflow automation: n8n, Zapier, or Temporal.

---

### 6) Delivery, POD, Billing & Settlement
**Steps:**
1. Capture POD (photo/signature/document upload).
2. Validate accessorials and detention timestamps.
3. Generate customer invoice + carrier settlement.
4. Reconcile payment status and close load.

**Automation opportunities:**
- OCR extraction from POD/BOL into structured fields.
- Auto-invoice on verified delivery milestone.
- Dispute workflow with SLA timers.

**Suggested tools:**
- Accounting/ERP: QuickBooks, NetSuite, Xero.
- Payments: Stripe for card/ACH collections.
- OCR: AWS Textract, Google Document AI.

---

## Operating Model and Roles
- **Sales/CSR:** intake, quoting, customer communication.
- **Dispatch:** capacity sourcing, execution, exception handling.
- **Billing:** invoice/settlement/reconciliation.
- **Ops manager:** KPI review, carrier performance, continuous improvement.

## Core KPIs by Stage
- Quote win rate, quote response time.
- Tender acceptance rate, time-to-cover.
- On-time pickup/delivery, exception frequency.
- Cost per mile, margin per load.
- DSO (days sales outstanding), billing cycle time.

## Recommended Automation Stack (Pragmatic)

### Phase 1 (0-30 days): Baseline Digitization
- Unified intake form + email parsing.
- Quote/load records in TMS.
- Standard dispatch templates.
- Milestone notifications (pickup/delivery).

### Phase 2 (31-90 days): Operational Intelligence
- Auto-tender waterfall.
- Carrier scorecards + compliance automation.
- Predictive ETA and exception playbooks.

### Phase 3 (91-180 days): Financial & AI Optimization
- Touchless billing for clean loads.
- Margin anomaly detection.
- AI copilot for quote suggestions and customer updates.

## Reference System Blueprint (for a Node.js/TypeScript stack)
- **API:** Express intake, quoting, dispatch, tracking, billing endpoints.
  - For all non-public routes, use the standard middleware chain in this order: rate limiting → authenticate → requireOrganization/requireScope → auditLog → validators → handleValidationErrors. See `docs/auth_rate_limit_runbook.md` and `docs/ROUTE_SCOPE_REGISTRY.md` to keep new endpoints aligned with the repo’s security and tenancy model.
- **DB:** PostgreSQL + Prisma, with repo models such as `Shipment`, `Load`, `ShipmentEvent`, `OrgInvoice`, and `CarrierScore`; quote, stop, carrier, and invoice are domain concepts here, not necessarily 1:1 Prisma model names in this repo.
- **Workers:** background jobs for OCR, notifications, ETA refresh, invoicing.
- **Web app:** Next.js operations dashboard and customer portal.
- **Auditability:** immutable timeline of dispatch and AI decisions for each load.

## Implementation Checklist
- [ ] Define intake schema + validation rules.
- [ ] Stand up quote-to-load conversion flow.
- [ ] Configure auto-tender rules and fallback sequence.
- [ ] Integrate GPS/milestone event ingestion.
- [ ] Implement exception alert matrix.
- [ ] Automate invoice + settlement generation.
- [ ] Launch KPI dashboard and weekly ops review cadence.
