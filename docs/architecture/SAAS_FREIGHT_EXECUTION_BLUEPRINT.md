# INFÆMOUS FREIGHT SaaS Execution Blueprint

This document translates the strategic vision into an implementable product
architecture for a multi-tenant freight operating system.

## 1) Platform Architecture

### Frontend

- `apps/web` (Next.js + React + Tailwind + TypeScript)
  - `/shipper`
  - `/broker`
  - `/carrier`
  - `/admin`
  - `/analytics`
- `apps/mobile` (React Native + Expo)
  - Driver App
  - Carrier Dispatch
  - Broker Notifications
  - Shipment Tracking

### Backend

- `apps/api` (Express + TypeScript + Prisma)
- Service domains
  - Auth Service
  - Load Service
  - Carrier Service
  - Broker Service
  - Shipment Service
  - Payment Service
  - AI Matching Service
  - Analytics Service

### Event/Data Flow

```text
Freight Demand
  -> Shipper Portal/API
  -> Load Creation
  -> AI + Broker Matching
  -> Carrier Network
  -> Shipment Tracking
  -> Delivery Confirmation
  -> Invoice + Payment
  -> Revenue Engine
```

## 2) Multi-Tenant SaaS Foundation

All data is scoped by `workspace_id` (organization boundary).

### Core tenancy entities

- `Organization`
- `Workspace`
- `User`
- `Role`
- `Permission`
- `Membership`

### Role model

- Carrier Admin
- Driver
- Broker
- Shipper
- Dispatcher
- Finance

### Multi-tenant guardrails

- Row-level scoping by `workspace_id` in every business table.
- JWT claims include `org_id`, `workspace_id`, and role scopes.
- Audit log for all sensitive mutations.

## 3) Operational Modules

### Carrier Network

Features:

- Fleet Management
- Driver Assignment
- Available Trucks
- Load Offers
- Revenue Analytics
- Compliance Records

Primary entities:

- `Carrier`
- `Truck`
- `Trailer`
- `Driver`
- `EquipmentType`
- `CarrierInsurance`
- `CarrierAuthority`

### Broker Network

Features:

- Load Creation
- Carrier Matching
- Rate Negotiation
- Dispatch
- Tracking
- Billing

### Shipper Experience

Modes:

1. Portal: manual shipment creation and management.
2. API: ERP/TMS integration for automated shipment ingestion.

## 4) Canonical Data Model (v1)

> The following model is a functional starting point for Prisma/PostgreSQL.

### Core load and shipment

```text
Load
- id (uuid)
- workspace_id (uuid)
- shipper_id (uuid)
- broker_id (uuid, nullable)
- origin_city, origin_state
- destination_city, destination_state
- equipment_type
- weight_lbs
- pickup_date
- rate_usd
- status [POSTED, BOOKED, IN_TRANSIT, DELIVERED, INVOICED, PAID]
- created_at, updated_at

Shipment
- id (uuid)
- load_id (uuid)
- carrier_id (uuid)
- driver_id (uuid)
- truck_id (uuid)
- trailer_id (uuid, nullable)
- dispatch_at, delivered_at
- pod_document_url (nullable)
- created_at, updated_at
```

### Carrier-side operations

```text
Truck
- id (uuid)
- workspace_id (uuid)
- carrier_id (uuid)
- truck_number
- equipment_type
- status [AVAILABLE, ASSIGNED, IN_TRANSIT, MAINTENANCE]
- current_lat, current_lng
- driver_id (uuid, nullable)

Driver
- id (uuid)
- workspace_id (uuid)
- carrier_id (uuid)
- first_name, last_name
- phone
- license_number
- status [ACTIVE, OFF_DUTY, INACTIVE]
```

### Tracking

```text
LocationPing
- id (uuid)
- workspace_id (uuid)
- load_id (uuid)
- shipment_id (uuid)
- lat, lng
- timestamp
- speed_mph
- heading_deg
- source [MOBILE, ELD, TELEMATICS]
```

### Billing and revenue

```text
Invoice
- id (uuid)
- workspace_id (uuid)
- load_id (uuid)
- shipper_id (uuid)
- subtotal_usd
- platform_fee_usd
- total_usd
- status [DRAFT, SENT, PAID, VOID]

Payment
- id (uuid)
- workspace_id (uuid)
- invoice_id (uuid)
- stripe_payment_intent_id
- amount_usd
- status [PENDING, SUCCEEDED, FAILED, REFUNDED]
```

## 5) API Surface (v1)

### Shipper endpoints

- `POST /api/shipments`
- `GET /api/shipments`
- `GET /api/shipments/:id`
- `POST /api/quotes`
- `GET /api/invoices/:id`

Example:

```json
{
  "shipperId": "123",
  "origin": "Dallas TX",
  "destination": "Atlanta GA",
  "equipment": "Reefer",
  "weight": 42000
}
```

Server-side orchestration for `POST /api/shipments`:

1. Create load.
2. Calculate dynamic rate.
3. Run carrier match ranking.
4. Notify brokers + eligible carriers.

### Carrier endpoints

- `GET /api/load-board`
- `POST /api/load-offers/:id/accept`
- `POST /api/shipments/:id/status`
- `POST /api/shipments/:id/documents`

### Broker endpoints

- `POST /api/loads`
- `PATCH /api/loads/:id`
- `POST /api/loads/:id/dispatch`
- `POST /api/loads/:id/negotiate`

### Tracking endpoints

- `POST /api/shipments/:id/location-pings`
- `GET /api/shipments/:id/tracking`

### Finance endpoints

- `POST /api/invoices/generate`
- `POST /api/payments/collect`
- `POST /api/payments/disburse`

## 6) AI Load Matching Engine

Carrier score formula:

```text
score =
  (distance_to_pickup * 0.4)
+ (equipment_match * 0.2)
+ (carrier_rating * 0.2)
+ (lane_history * 0.2)
```

Offer execution:

1. Rank top carriers.
2. Trigger push notifications.
3. Trigger SMS/email fallback.
4. Publish offers in the driver app.

## 7) Document Automation

`/services/documents` generates and stores:

- Rate Confirmation
- Bill of Lading
- Proof of Delivery
- Invoice

Implementation notes:

- Templated HTML-to-PDF generation.
- Signed URL storage for access control.
- Automatic association with load/shipment IDs.

## 8) Payment and Revenue Engine

### Subscription revenue

- Carrier Plan: `$49/month`
- Broker Plan: `$149/month`
- Shipper Plan: `$199/month`
- Premium Load Board Visibility: `$35/month`

### Transactional revenue

- Platform fee: `2%–5%` of load value.
- Example: `$2,000 load * 3% = $60 platform revenue`.

### Embedded finance opportunities

- QuickPay
- Factoring
- Fuel cards
- Insurance marketplace

## 9) Analytics and AI Command Layer

### Analytics KPIs

- Lane demand
- Carrier performance
- Revenue growth
- On-time performance
- Market rate variance

### Command interface examples

- `/create_load Dallas Atlanta Reefer 42000`
- `/find_truck Chicago DryVan tomorrow`
- `/track_load 58122`
- `/optimize_lane California`

These commands should orchestrate API workflows instead of bypassing role and
permission checks.

## 10) Security and Compliance

- JWT authentication + scoped claims
- Role-based authorization (RBAC)
- Encryption at rest + TLS in transit
- Tenant isolation controls
- Immutable audit logs
- OWASP secure coding checks

## 11) Infrastructure Blueprint

Recommended deployment topology:

- Cloud: AWS, GCP, or Fly.io
- API cluster (stateless)
- Worker cluster (matching, docs, notifications)
- Redis (cache + queues)
- PostgreSQL (primary data store)
- Object storage (documents)
- Docker + Kubernetes for orchestration

## 12) Network Effects Strategy

```text
More Shippers
  -> More Loads
  -> More Carriers
  -> Faster Coverage
  -> More Brokers
  -> More Revenue
```

The product objective is not just freight tooling—it is freight liquidity and
operational coordination at network scale.
