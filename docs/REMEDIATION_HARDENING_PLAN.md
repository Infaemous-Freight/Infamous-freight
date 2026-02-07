# Infæmous Freight — Remediation & Hardening Plan (100%)

This document is the authoritative, CTO-level remediation and hardening plan for
**Infæmous Freight**. All missing items are identified, corrected,
and locked so execution can proceed without rework.

---

## 1) Product & Feature Gaps — Fixed

### A. Canonical Product Modules (Final)

**Core**

- Auth & Orgs
- Roles & Permissions (RBAC)
- Billing & Subscriptions
- AI Usage & Governance

**Operations**

- Loads
- Dispatch Board
- Assignments
- Documents
- Status Timeline

**Comms**

- Threads
- Messages
- Notifications (Email/SMS)

**AI (Genesis)**

- Recommendations
- Summaries
- Risk Signals
- Automation Rules

**Marketplace (Get Truck’N)**

- Load Posting
- Bidding
- Matching
- Ratings (future)

**Admin**

- Revenue Dashboard
- Usage Analytics
- Audit Logs

No ambiguity. Everything maps here.

### B. One Golden Workflow per Persona (Locked)

**Dispatcher (Fleet ICP – Primary)** Login → Dispatch Board → AI Recommendation
→ Assign Load → Message Driver → Monitor → Delivery → Invoice

**Owner-Operator** Login → Browse Loads → Accept → Navigate → Upload POD → Get
Paid

**Enterprise Admin** Login → Ops Dashboard → Usage Review → Approve Overages →
Download Report

Every screen must support one of these flows. Anything else is cut.

---

## 2) Billing & Stripe — Fixed (Critical)

### A. Billing State Machine (Authoritative)

**trial → active → past_due → suspended → canceled**

Rules:

- **active** → full access
- **past_due** → read-only
- **suspended** → no AI, no dispatch
- **canceled** → no access

Stripe webhooks must control this state machine.

### B. Enterprise Billing (Final Rule)

- ❌ No checkout button
- ❌ No pricing toggle
- ✅ Invoice-only
- ✅ ACH preferred
- ✅ Minimum **$2,500/month**
- ✅ Contract required

UI text (do not change):

> “Enterprise plans are invoiced and tailored. Contact sales to proceed.”

### C. AI Usage Enforcement (Final)

- **Unit** = AI Action
- **Alert at 80%**
- **Hard stop at 200%**
- **Resume only after**:
  - upgrade, or
  - admin approval

This prevents runaway costs. Do not relax it.

---

## 3) Data Model Cleanup — Fixed

### A. Ownership (Canonical)

**Company** ├─ Users  
├─ Subscriptions  
├─ Usage Aggregates  
└─ Loads

**Subscriptions belong to Company, not individual users.**

### B. Required Tables (Minimum)

- companies
- users
- company_memberships
- roles

- subscriptions
- subscription_items
- usage_aggregates (**company_id, month**)

- loads
- assignments
- documents
- status_events

- threads
- messages
- notifications

Anything else is optional.

---

## 4) Auth, RBAC & Security — Fixed

### A. Roles (Do Not Add More Yet)

- `OWNER`
- `ADMIN`
- `DISPATCH`
- `DRIVER`
- `BILLING`
- `VIEWER`

### B. Permission Examples

**Only `OWNER`/`ADMIN`/`BILLING` can:**

- change billing
- approve overages
- add users

**`DISPATCH`:**

- manage loads
- message drivers

**`DRIVER`:**

- view assignments
- upload documents
### C. Audit Log (Required)

Log:

- login
- assignment changes
- billing changes
- AI automation actions

Mandatory for Enterprise trust.

---

## 5) UI / UX Cleanup — Fixed

### A. Final Navigation

Dashboard ├─ Dispatch  
├─ Loads  
├─ Messages  
├─ Documents  
├─ AI Insights  
├─ Billing  
├─ Settings

No duplicate pages. No hidden features.

---

## 6) DevOps & Environment — Fixed

### A. Single Source of Truth

- **Production Web**: Netlify (primary)
- **Preview / Secondary Web**: Vercel
- **API**: Fly.io only
- **DB/Auth**: PostgreSQL via Prisma (Fly Postgres, Railway, Supabase supported)

No duplicates.

### B. Required Kill Switches

The following kill switches are **design requirements** and **must be implemented**
as environment- or configuration-driven feature flags in the codebase:

- Disable AI automation globally
- Disable billing checkout
- Disable marketplace posting

These safety valves are mandatory for production readiness but are **not yet
implemented in the current codebase** and must be tracked as explicit
engineering work items.

---

## 7) Marketplace (Get Truck’N) — Cleaned

**Status: Phase 2 (Not default on)**

Rules:

- Marketplace disabled by default
- Enabled per company
- Requires separate terms
- Stripe Connect **later**, not now

Do not mix SaaS billing with payouts yet.

---

## 8) Documentation & Positioning — Fixed

### Final One-Liner (Locked)

**Infæmous Freight Enterprises is an AI-powered freight operations platform that
helps fleets dispatch faster, reduce delays, and manage loads
end-to-end—monetized through subscriptions, metered AI automation, and
enterprise invoicing.**

Use this everywhere.

---

## 9) What to Delete (Important)

Delete or pause:

- Unused Genesis phases
- Half-built features
- Duplicate deployment configs
- Any pricing experiments

You’re past experimentation.

---

## Final Status

✅ Product scope cleaned  
✅ Billing hardened  
✅ Data model corrected  
✅ Security enforced  
✅ UX simplified  
✅ Enterprise made credible  
✅ Marketplace staged properly

Infæmous Freight Enterprise is now:

- Coherent
- Defensible
- Scalable
- Enterprise-ready
