# INFÆMOUS FREIGHT — Live SaaS Core Systems

This document defines how INFÆMOUS FREIGHT operates as a connected freight
software ecosystem where supply, demand, coordination, and monetization run as
one platform.

## System Overview

INFÆMOUS FREIGHT has four live core systems:

1. Carrier Network (supply)
2. Broker Network (liquidity and coordination)
3. Shipper Integration (demand)
4. Revenue Engine (monetization)

When these systems operate together, the platform behaves like a unified
freight operating system rather than a single-point logistics tool.

---

## 1) Carrier Network

The carrier network is the supply layer: trucks, drivers, and fleet operations
that physically move freight.

### Core Features

- Carrier onboarding with MC/DOT verification
- Fleet management and asset visibility
- Driver mobile workflows
- Real-time location tracking
- Load acceptance workflow
- Rate confirmation automation
- POD (proof of delivery) uploads
- Compliance verification and monitoring

### SaaS Components

- Carrier dashboard
- Dispatch board
- Mobile driver app (React Native / Expo)
- ELD integration
- GPS tracking APIs
- Fleet analytics

### Data Objects

- `Carrier`
- `Truck`
- `Trailer`
- `Driver`
- `LoadAssignment`
- `LocationPing`
- `ComplianceRecord`

### Network Effect

More carriers increase load coverage speed and reliability, which improves
shipper retention and on-time performance.

---

## 2) Broker Network

The broker network is the liquidity layer that matches available freight with
available capacity.

The system supports:

- Internal brokers
- Third-party brokers
- Automated AI brokerage workflows

### Core Broker Workspace Features

- Load posting
- Carrier matching
- Rate negotiation support
- Contract automation
- Document exchange
- Communication hub
- AI load recommendations

### Key Modules

- `LoadBoard`
- `BrokerWorkspace`
- `RateEngine`
- `ContractAutomation`
- `CarrierMatchingAI`
- `CommunicationHub`

### AI Matching Model (Reference)

```text
AI Match Score =
  distance_to_pickup +
  carrier_reliability +
  equipment_match +
  historical_lane_rate
```

This scoring layer enables a digital brokerage mode where the platform can
autonomously prioritize high-probability load/truck matches.

---

## 3) Shipper Integration

Shippers generate demand and inject shipment requests into the platform.

### Typical Shipper Segments

- Manufacturers
- Retailers
- Distribution centers
- E-commerce brands

### Integration Types

#### API Integration

ERP/WMS systems integrate directly into INFÆMOUS FREIGHT APIs.

Common targets include:

- SAP
- Oracle
- Shopify
- NetSuite
- Warehouse Management Systems (WMS)

#### Portal Integration

Shippers can also log in to create and manage loads manually through a shipper
portal.

### Core Features

- Shipment creation
- Rate quotes
- Lane optimization
- Shipment tracking
- Invoice automation
- Analytics dashboards

### Shipper Data Objects

- `Shipper`
- `Warehouse`
- `Shipment`
- `PickupLocation`
- `DeliveryLocation`
- `FreightClass`
- `RateQuote`
- `Invoice`

---

## 4) Revenue Engine

The revenue engine monetizes platform activity through multiple parallel streams.

### Revenue Stream 1: SaaS Subscriptions

- Carrier Plan: $49/month
- Broker Plan: $149/month
- Shipper Plan: $199/month
- Enterprise contracts: commonly $10,000-$100,000 annually

### Revenue Stream 2: Transaction Fees

- Platform fee per load: 2%-5%
- Example:
  - Load value: $2,000
  - Platform fee: 3%
  - Revenue per load: $60
  - At 10,000 loads/month: $600,000 monthly fee revenue

### Revenue Stream 3: Load Board Access

- Premium load board access (example carrier plan): $35/month
- Comparable to established market models (e.g., DAT / Truckstop)

### Revenue Stream 4: Financing and Payments

Embedded financial services:

- QuickPay
- Freight factoring
- Fuel cards
- Insurance marketplace

Revenue is captured through financing/payment margins and partner economics.

---

## Integrated Platform Flow

```text
               SHIPPERS
                   |
                   |  Shipment Requests
                   v
           INFÆMOUS FREIGHT CORE
            (AI Command System)
                   |
       +-----------+-----------+
       |           |           |
       v           v           v
    Brokers     Carriers      Data
       |           |           |
       +------ Freight Movement+
                   |
                   v
             Revenue Engine
```

---

## Strategic Differentiation

Most freight software products optimize one layer (brokerage, load board,
tracking, or visibility). INFÆMOUS FREIGHT is designed as a full freight
operating system that combines:

- Load board
- Brokerage workflows
- Carrier network
- Shipper portal
- AI command system

This full-stack model creates defensibility through data network effects,
workflow lock-in, and multi-stream monetization.

---

## AI Command Interface (Control Layer)

A natural-language command layer allows operators to act across the entire
network from one interface.

### Example Commands

- `/find_truck Dallas reefer tomorrow`
- `/quote_rate Chicago -> Atlanta`
- `/optimize_lane California network`
- `/track_shipment 58421`

This command surface is the operating control plane for scaling toward a
national freight grid model.

---

## Next-Stage Scale Direction

The logical scale phase is a national freight grid built on:

- Carrier density maps
- AI routing and dispatch optimization
- Predictive logistics
- Autonomous dispatch orchestration

At this stage, the platform begins to behave more like infrastructure than a
single SaaS application.
