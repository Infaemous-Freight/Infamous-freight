# Infamous Freight MVP Build Plan

## Decision

Use the existing GitHub repository as the production foundation instead of starting over in GitHub Spark.

Spark remains useful for rapid UI experiments, but this repository already has the stronger long-term base: React/Vite frontend, API workspace, Prisma, Supabase, Stripe, Docker, validation scripts, and deployment-oriented tooling.

## MVP Scope Added in This Branch

This branch adds customer-facing and carrier-facing MVP screens that complement the existing operations dashboard.

### Public screens

- `/home` — public Infamous Freight landing page
- `/request-quote` — public quote request intake form
- `/track-shipment` — public shipment tracker
- `/customer-portal` — customer dashboard MVP
- `/carrier-portal` — carrier dashboard MVP
- `/freight-assistant` — AI-style freight intake assistant MVP
- `/ops` — route alias to the existing operations dashboard

## Production Path

### Phase 1 — UI workflow validation

- Confirm page flow and copy
- Confirm customer/carrier/dispatch roles
- Validate required quote fields
- Validate shipment status labels
- Validate portal KPIs

### Phase 2 — Data model and API wiring

Add or confirm models for:

- Customers
- Contacts
- Quote requests
- Shipments
- Shipment events
- Carriers
- Carrier documents
- Load offers
- Invoices
- Support requests

Connect public forms to API endpoints and persistence.

### Phase 3 — Authentication and role permissions

Recommended roles:

- Admin
- Dispatcher
- Customer
- Carrier
- Driver
- Accounting

The public quote request can remain unauthenticated, but portals should require auth.

### Phase 4 — Integrations

Prioritize:

- Supabase/Postgres persistence
- Stripe billing/customer portal
- Document storage
- Email notifications
- Carrier/load-board APIs
- Accounting integrations
- Telematics/check-call integrations

### Phase 5 — Deployment readiness

Before production release:

```bash
npm install
npm run lint
npm run build
npm run test
npm run production:preflight
```

## Spark Prompt for Future Prototyping

Use this prompt in GitHub Spark only for visual experiments or new workflow ideas:

```text
Create a modern freight logistics web app called Infamous Freight.

The app should serve shippers, carriers, and internal dispatch/admin users.

Build the following pages:
1. Landing page with strong freight/logistics branding, CTA buttons for “Request a Quote” and “Track Shipment”.
2. Quote request form collecting origin, destination, freight type, weight, dimensions, pickup date, delivery date, contact info, and special instructions.
3. Shipment tracking page where a customer can enter a tracking number and see status, pickup, transit, delivery, and notes.
4. Customer dashboard showing active shipments, completed shipments, quotes, invoices, and support requests.
5. Admin dashboard showing quote requests, shipments, carriers, customers, revenue summary, and pending tasks.
6. Carrier dashboard showing available loads, assigned loads, delivery status, documents, and payment status.
7. AI assistant that helps summarize quote requests and suggest next operational steps.

Use a clean, professional logistics design. Prioritize mobile responsiveness, clear workflows, and business usability.
```

## Immediate Follow-Up Tasks

- Wire quote request form to backend API
- Replace demo shipment data with persisted data
- Add customer/carrier authentication gates
- Add role-aware navigation
- Add document upload for POD, BOL, carrier packet, W-9, and insurance
- Add notification events for quote received, carrier assigned, pickup confirmed, exception, delivered, and POD uploaded
