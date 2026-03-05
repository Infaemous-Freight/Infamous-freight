# Infamous Freight Autonomous Logistics Platform Blueprint

This document translates the autonomous freight vision into an implementable
system architecture with concrete services, data contracts, and execution
workflows.

## 1) North Star

Build a freight platform that **makes logistics decisions automatically**:

- Not dashboard-only software
- Not spreadsheet-driven dispatch
- A decision engine that can price, match, book, and monitor freight with human
  override controls

## 2) Layered Platform Architecture

```text
User Interface Layer
        │
API Gateway Layer
        │
AI Command Engine
        │
Freight Intelligence Layer
        │
Infrastructure + Data Layer
```

### Layer responsibilities

1. **User Interface Layer**: command entry, workflow approvals, visibility
2. **API Gateway Layer**: auth, routing, policy enforcement, orchestration
3. **AI Command Engine**: intent parsing, planning, decision execution
4. **Freight Intelligence Layer**: optimization models + scoring engines
5. **Infrastructure + Data Layer**: storage, events, model serving, security

## 3) User Interface Layer

## Web Client (Shipper / Broker / Carrier)

- **Stack**: Next.js + React + Chakra UI + Emotion + GraphQL
- **Primary roles**:
  - **Shippers** create shipments and monitor service levels
  - **Brokers** supervise matching, pricing, and exception handling
  - **Carriers** discover and accept loads
- **Core modules**:
  - Load board
  - Shipment tracking timeline
  - Instant rate quoting interface
  - Analytics dashboard
  - Carrier marketplace

## Mobile Client (Driver / Carrier Ops)

- **Stack**: React Native / Expo
- **Core workflows**:
  - Driver load acceptance
  - Live GPS tracking
  - Document scanning (BOL/POD)
  - Delivery confirmation and exception capture

## 4) API Gateway Layer

- **Stack**: Node.js + Express + TypeScript
- **Responsibilities**:
  - JWT authentication and role authorization (HMAC via `JWT_SECRET` by default; optional RS256 via JWKS middleware)
  - Request routing to domain services
  - Rate limiting and abuse prevention
  - Structured logging and audit IDs
  - Service orchestration for multi-step operations

### Reference endpoint

- `POST /api/shipments` creates a new shipment and emits `shipment_created`

## 5) AI Command Engine (Decision Brain)

Users issue commands in natural language:

- "Find cheapest carrier for Dallas → Atlanta"
- "Predict delay risk for shipment 88321"
- "Book carrier automatically if risk < 0.3"

Execution pipeline:

```text
Command
  -> Intent detection
  -> Entity extraction (lane, dates, shipment)
  -> Policy + role check
  -> Freight decision engine
  -> Action execution
  -> Human-readable response + audit event
```

### Core components

- Command parser
- Intent classifier
- Tool planner
- Execution coordinator
- Safety guardrails (policy, threshold, approval)

## 6) Freight Intelligence Layer

### 6.1 Carrier Intelligence Engine

Carrier score formula:

```text
score =
  0.30 * on_time
+ 0.20 * tender_accept
+ 0.20 * safety
+ 0.15 * price
+ 0.15 * reliability
```

Primary tables:

- `carrier_profiles`
- `carrier_history`
- `carrier_performance`

### 6.2 Rate Prediction Engine

**Inputs**:

- Lane
- Distance
- Seasonality
- Fuel price
- Demand
- Capacity
- Historical spot rate

**Outputs**:

- `rate_prediction`
- `confidence`
- `margin`

**Used for**:

- Instant quoting
- Automated negotiation
- Margin protection

### 6.3 Shipment Prediction Engine

Predicts:

- ETA
- Delay probability
- Weather disruption risk
- Route risk

Data sources:

- GPS telemetry
- ELD integrations
- Traffic APIs
- Weather APIs
- Carrier historical data

## 7) Freight Visibility Engine

Every shipment is represented as a live data object:

```text
Shipment
 ├ location
 ├ status
 ├ ETA
 ├ carrier
 ├ documents
 └ risk_score
```

Update sources:

- Driver mobile app
- ELD integrations
- Carrier APIs
- Satellite / GPS providers

## 8) Revenue Engine

Revenue model mix:

| Stream | Model |
| --- | --- |
| Broker margin | Per load |
| Shipper SaaS | Monthly subscription |
| Carrier subscription | Load board access |
| AI analytics | Enterprise plan |
| Financial services | Commission |

Suggested commercial baseline:

- `$150` shipper SaaS
- `$99` carrier SaaS
- `2–6%` broker margin
- Data/API licensing for enterprise accounts

## 9) Data Architecture

Core data plane:

- PostgreSQL: system of record
- Redis: cache, sessions, short-lived state
- Object storage: documents and large artifacts

Core tables:

- `users`
- `companies`
- `shipments`
- `loads`
- `carriers`
- `rates`
- `tracking_events`
- `documents`

Reference DDL:

```sql
CREATE TABLE shipments (
  id UUID PRIMARY KEY,
  origin TEXT,
  destination TEXT,
  carrier_id UUID,
  status TEXT,
  eta TIMESTAMP,
  created_at TIMESTAMP
);
```

## 10) Event-Driven Backbone

Freight emits events continuously:

- `shipment.created`
- `shipment.carrier_assigned`
- `location.update`
- `shipment.delay_detected`
- `shipment.delivered`

Canonical event topics follow the pattern `<domain>.<event>`. Existing systems
may use transport-specific naming (e.g. agent engine: `shipment.assigned`,
websockets: `location:update`, webhooks: `loads:new`); these should map
cleanly onto the canonical topics above.
Streaming options:

- Kafka (high-throughput, replay-heavy workloads)
- Redis Streams (lighter operational footprint)

## 11) AI Infrastructure

Model services run as independent workloads:

- **Runtime**: Python services with FastAPI
- **Frameworks**: PyTorch / TensorFlow

Models:

| Model | Purpose |
| --- | --- |
| Rate prediction | Pricing |
| ETA prediction | Tracking |
| Carrier ranking | Matching |
| Fraud detection | Security |

## 12) Deployment Topology

Cloud-native baseline:

- Docker containers
- Kubernetes orchestration
- Fly.io regional deployment

Infrastructure blocks:

- CDN
- Load balancer
- API cluster
- AI cluster
- Database cluster

Delivery pipeline:

- GitHub Actions CI/CD

## 13) Security and Access Control

Required controls:

- JWT RS256 authentication
- Encryption at rest
- TLS for all service boundaries
- OWASP-aligned hardening
- Role-based permissions

Core roles:

- `admin`
- `broker`
- `shipper`
- `carrier`
- `driver`

## 14) Autonomous Command Interface Contract

Target command experience:

```text
> book carrier for shipment 88321
> predict delay risk
> find cheaper route
```

Execution stages:

1. Parser understands intent + entities
2. Decision engine selects best action
3. Executor writes operational state changes
4. Visibility layer updates downstream stakeholders

## 15) Implementation Priorities (What Makes the Platform "Dangerous")

1. **Autonomous carrier matching**
2. **AI rate prediction**
3. **Real-time shipment intelligence**

These three capabilities combine into a self-optimizing freight network with
high leverage against manual brokerage workflows.
