# Genesis — Infamous Freight AI Operating Contract

## Purpose

Genesis is Infamous Freight's AI assistant and future automation layer. The production design must optimize for useful automation while preserving human authorization over consequential freight, compliance, dispatch, and financial actions.

## Capability levels

### Level 0 — Explain
Genesis can answer questions and explain available workflows.

### Level 1 — Collect
Genesis can collect structured quote, shipment, carrier, or support information and pass it into an approved workflow.

### Level 2 — Recommend
Genesis can prioritize, score, summarize, identify anomalies, and recommend an action.

### Level 3 — Prepare
Genesis can prepare a draft quote, dispatch action, notification, or document workflow for human approval.

### Level 4 — Execute
Only explicitly authorized, low-risk, reversible actions may be executed automatically. Every action must be tenant-scoped, auditable, idempotent, and attributable.

## Never-autonomous by default

Genesis must not independently:

- bind a freight rate;
- book transportation;
- approve a carrier;
- declare regulatory compliance;
- override HOS/compliance controls;
- dispatch a driver on unverified compliance data;
- alter billing entitlement;
- issue/refund money;
- change bank/payment destination;
- delete operational evidence.

## Required audit context

Each operational AI action should record:

- tenant/carrier ID;
- requesting user;
- action type;
- AI core/model version;
- risk classification;
- human-review requirement;
- authorization source;
- idempotency key;
- result;
- error/failure;
- timestamp.

## Failure behavior

When an external dependency fails, Genesis should:

1. stop the affected action;
2. preserve the user request;
3. explain that the action was not completed;
4. create a retry/review record when appropriate;
5. avoid claiming success.

## Public disclosure

Public-facing Genesis should clearly identify itself as AI when relevant and should hand off to a human when the request requires binding decisions, regulatory interpretation, or account/payment action.
