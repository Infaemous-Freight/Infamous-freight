# Infamous Freight Website: What It Should Look Like and Do

## Product intent
- Present Infamous Freight as a trustworthy autonomous freight operating system.
- Let prospects understand value quickly and book a demo.
- Let customers securely sign in to manage freight operations.

## Information architecture
1. **Marketing site**
   - Home
   - Product
   - Pricing
   - Security
   - Integrations
   - Resources (docs/blog/changelog)
   - Contact / Book demo
2. **Authenticated app**
   - Dashboard
   - Loads / Dispatch
   - Carriers / Brokers / Drivers
   - Documents & Invoices
   - Billing & Usage
   - Organization Settings (users, roles, API keys, webhooks)

## Visual direction
- **Style:** clean, logistics-forward, enterprise SaaS.
- **Colors:** dark slate + high-contrast accent (teal/blue) with clear status colors.
- **Layout:** dense-but-readable data tables in app; high-level storytelling on marketing pages.
- **Typography:** modern sans-serif with clear hierarchy and strong numeric readability.
- **Responsiveness:** mobile-first for marketing, tablet/desktop optimized for operations workflows.

## Critical UX flows
1. **Acquire**
   - Visitor understands outcomes in <10 seconds.
   - CTA: “Book Demo” and secondary CTA: “See Platform”.
2. **Activate**
   - Fast onboarding: create org, invite users, connect first integration.
3. **Operate**
   - Dispatch board, load lifecycle, exception management, and communication timeline.
4. **Control**
   - Tenant-isolated org settings, RBAC, audit trails, billing visibility.
5. **Trust**
   - Security center, uptime/health links, incident communication, compliance posture.

## Functional requirements
- **Authentication first:** secure sign-up/sign-in, MFA-ready, session management.
- **Organization & tenant isolation:** every view and action scoped to organization.
- **RBAC:** owner/admin/dispatcher/viewer roles with explicit permission checks.
- **Audit logging:** all sensitive actions captured and visible in-app.
- **Billing:** plan usage, invoices, payment method updates, idempotent webhook handling.
- **AI transparency:** every AI-assisted recommendation links to decision logs.

## AI / Synthetic Intelligence experience
- Position AI as a **decision copilot**, not a black box.
- Show confidence score, rationale, and impacted entities for every recommendation.
- Provide clear controls: **accept**, **edit**, **reject**, and **undo**.
- Require tenant-safe context for every AI action (organization-scoped data only).
- Persist every AI decision and operator override in `AiDecisionLog`.
- Make AI outcomes measurable with KPI deltas (on-time %, margin, cycle time, exception rate).
- Include an “AI Safety Center” page:
  - model usage policy
  - data handling boundaries
  - human-in-the-loop controls
  - incident escalation and fallback behavior

## Homepage content blocks
1. Hero: one-sentence value proposition + primary CTA.
2. Proof strip: customer logos / metrics.
3. Core capabilities: dispatch automation, load visibility, billing automation.
4. AI trust section: explain recommendations + human override.
5. Security & compliance section.
6. Integrations section.
7. Pricing preview.
8. Final CTA + FAQ.

## In-app dashboard essentials
- KPI cards: active loads, on-time %, margin, exceptions, invoice aging.
- Dispatch queue with priority indicators.
- Recent AI recommendations requiring review.
- Billing state + plan limits.
- System health widget (API, integrations, webhook state).

## MVP website should do (ship-ready checklist)
- Convert traffic to qualified pipeline:
  - sticky “Book Demo” CTA
  - short lead form with role/company size/fleet size
  - calendar scheduling handoff
- Convert prospects to product trials:
  - clear “Start Free Trial” path
  - guided onboarding wizard after signup
- Reduce support burden:
  - searchable docs + onboarding checklist
  - contextual help in-app for billing, dispatch, and AI actions
- Improve trust and reliability perception:
  - visible uptime/health links
  - security page with architecture + data handling summary
  - transparent AI decision controls and auditability

## Success metrics (first 90 days)
- Visitor → demo conversion rate
- Signup → first load dispatched time
- Trial → paid conversion rate
- Weekly active dispatchers per organization
- AI recommendation acceptance/rejection rate
- Invoice automation rate and payment collection time

## Implementation map (Next.js + API)
- **Public pages (apps/web)**  
  Home, Product, Pricing, Security, Integrations, Docs index, Demo booking.
- **Authenticated routes (apps/web + apps/api)**  
  `/dashboard`, `/loads`, `/dispatch`, `/carriers`, `/drivers`, `/billing`, `/settings`.
- **Core API dependencies (apps/api)**
  - auth/session endpoints
  - organization + membership endpoints
  - RBAC-protected operations endpoints
  - billing + webhook endpoints
  - audit log and AI decision log read/write endpoints
- **Shared contracts (packages/shared)**  
  Keep page data contracts and API response types centralized for frontend/backend consistency.

## Non-functional requirements
- Fast page loads and optimistic UI for frequent operations.
- Accessible UI (WCAG AA contrast, keyboard navigation, screen-reader labels).
- Strong observability (errors, traces, release health, uptime checks).
- Clear empty/error states with actionable recovery.

## Launch checklist
- [ ] Marketing pages complete with clear CTAs.
- [ ] Authentication + org onboarding polished.
- [ ] RBAC enforced across protected routes.
- [ ] Tenant isolation verified in all data access paths.
- [ ] Billing and webhook flows tested end-to-end.
- [ ] Health and status pages reachable and accurate.
- [ ] Analytics and Sentry monitoring verified in production.
