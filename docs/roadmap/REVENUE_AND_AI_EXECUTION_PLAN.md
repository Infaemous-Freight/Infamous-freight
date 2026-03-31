# Revenue + AI Execution Plan (30/60/90)

## Objective
Sequence work so V1 revenue operations are measurable and reliable before scaling AI recommendations globally.

## North-Star KPIs
- Time from `Delivered` -> invoice generated (median, P95)
- Days Sales Outstanding (DSO)
- % of delivered loads invoiced within SLA
- Margin lift from AI recommendations vs baseline
- Dispatcher adoption rate of AI recommendations

## 30 Days — Revenue Loop Instrumentation

### Scope
1. Instrument load lifecycle transition timestamps.
2. Add invoice and payment latency analytics dashboard widgets.
3. Define and enforce SLA alerts for delayed invoice generation.
4. Publish baseline KPI values by tenant segment.

### Deliverables
- KPI definitions and data contracts documented.
- Dashboard panels for invoice velocity and DSO.
- Alert policy for “delivered but not invoiced” breaches.

## 60 Days — AI-in-Workflow Pilot

### Scope
1. Add lane recommendation panel into dispatcher workflow.
2. Provide recommendation rationale summary (risk, seasonality, reliability factors).
3. Add confidence score and fallback behavior for low-confidence cases.
4. Track accept/override outcomes and financial impact.

### Deliverables
- Pilot enabled for selected tenant cohort.
- Weekly pilot review template and KPI readout.
- Human override reason taxonomy for model feedback loops.

## 90 Days — Enterprise Rollout Readiness

### Scope
1. Operationalize trust-center collateral for procurement flows.
2. Attach security and compliance artifacts to enterprise sales playbooks.
3. Formalize SLA tiers and onboarding runbook.
4. Freeze enterprise-ready release checklist and handoff process.

### Deliverables
- Enterprise launch checklist signed by Eng, Security, Legal, Success.
- Reference customer case study template with ROI proof.
- Sales enablement packet with technical objection handling.

## Exit Criteria
- KPI deltas are measurable at tenant and global levels.
- AI pilot shows directional margin improvement with acceptable override rates.
- Enterprise sales can complete trust review and technical due diligence without ad-hoc engineering support.
