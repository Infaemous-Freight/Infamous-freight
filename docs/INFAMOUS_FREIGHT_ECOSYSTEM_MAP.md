# Infæmous Freight Ecosystem Map

## System Vision

Infæmous Freight is positioned as a logistics operating system that connects shippers, brokers, carriers, drivers, and operations teams through a shared data and workflow layer.

```text
Infæmous Freight Platform
        ↓
National Carrier Network
        ↓
AI Freight Command Engine
        ↓
Load Marketplace
        ↓
Broker + Carrier Automation
        ↓
Revenue Engine
```

## Ecosystem Layers

### 1) Network Layer (Participants)
- **Shippers**: create tenders, track service levels, manage lanes.
- **Brokers**: source capacity, negotiate rates, coordinate exceptions.
- **Carriers/Fleets**: accept loads, assign dispatch, monitor utilization.
- **Drivers**: execute pickups/deliveries, submit POD and compliance docs.

### 2) Freight Core (System of Record)
- **Loads**: posted opportunities with lane, equipment, timing, and pricing.
- **Shipments**: booked loads with status, milestones, and audit trail.
- **Documents**: BOL, POD, insurance, factoring, invoices.
- **Tracking events**: location pings, ETA updates, delays, exceptions.

### 3) Marketplace + Execution Layer
- Search and filter live load board inventory.
- Book and confirm loads with role-based workflows.
- Negotiate rates and record broker/carrier commitments.
- Dispatch and reassignment controls for operational resilience.

### 4) AI Command Layer
Examples of command UX:
- `/find loads Dallas to Atlanta`
- `/show highest paying loads this week`
- `/assign driver J. Carter to load 4932`
- `/track shipment IF-2026-00192`

AI command capabilities:
- Intent-to-action orchestration across API services.
- Context-aware recommendations (lane fit, rate quality, risk).
- Alerting for delays, detention risk, and SLA breaches.

### 5) Revenue Layer
| Revenue Stream | Example |
|---|---|
| Transaction fee | `$20` per completed load |
| Broker SaaS plan | `$99/month` |
| Carrier premium tools | `$29/month` |
| AI command/copilot add-on | `$49/month` |

## Recommended Build Sequence

### Phase A — Freight Network Engine
1. Finalize data model for shippers, brokers, carriers, drivers, loads, shipments.
2. Harden identity + permissions per role.
3. Implement event timeline for shipment lifecycle.

### Phase B — Load Board + Booking
1. Build posting/search/match APIs.
2. Add booking workflow with status transitions.
3. Instrument key metrics (time-to-book, acceptance rate, margin).

### Phase C — Mobile Driver Experience
1. Push load alerts and availability controls.
2. Route + stop execution with geofenced milestone updates.
3. Native doc capture for POD and compliance uploads.

### Phase D — AI Command System
1. Stand up command parser and permission-aware action router.
2. Add operational copilots (pricing, dispatch, exception management).
3. Integrate explainability + audit logs for enterprise trust.

### Phase E — Enterprise Readiness
1. SOC 2 roadmap execution and security rotation adherence.
2. Tenant-level controls, audit exports, and contract-grade reporting.
3. Expand integrations (TMS/ERP/telematics/payment providers).

## KPI Stack (Operate Like a Platform)

- **Network growth**: active carriers, active drivers, shipper retention.
- **Marketplace liquidity**: post-to-book time, fill rate, load aging.
- **Execution quality**: on-time pickup/delivery %, claims and exceptions.
- **Financial performance**: gross margin per load, revenue per tenant, LTV/CAC.
- **Trust/compliance**: security incidents, audit findings, role-based access violations.

## Strategic North Star

Build in layers, measure relentlessly, and prioritize execution reliability before feature sprawl. The company that owns the operational data loop (planning → booking → execution → settlement) becomes the default logistics platform.
