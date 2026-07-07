# Infamous Freight — Documentation Index

This directory contains operational, architectural, and launch-readiness documentation for the Infamous Freight platform. Use this index to navigate; documents are grouped by purpose rather than alphabetically.

> Looking for the project overview? See the [root README](../README.md).
> Looking for environment variables? See [`environment/`](./environment).

---

## 🧭 Platform Setup & Roadmap

- [INFAMOUS_FREIGHT_MASTER_IMPLEMENTATION_PLAN.md](./INFAMOUS_FREIGHT_MASTER_IMPLEMENTATION_PLAN.md) — Master implementation plan for Genesis, portals, quote intake, tracking, KPIs, and service expansion.
- [INFAMOUS_FREIGHT_EXECUTION_BACKLOG.md](./INFAMOUS_FREIGHT_EXECUTION_BACKLOG.md) — Developer-ready workstream backlog for the recommended rollout.
- [NEXT_SPRINT_PUBLIC_REVENUE_LIVE_OPS.md](./NEXT_SPRINT_PUBLIC_REVENUE_LIVE_OPS.md) — Next sprint plan for public revenue capture and live operations wiring.
- [LIVE_WIRING_CHECKLIST.md](./LIVE_WIRING_CHECKLIST.md) — Live data wiring checklist for `/loads`, `/dispatch`, `/quotes` transformation from demo to operational.
- [platform-roadmap.md](./platform-roadmap.md) — Phased build direction for Infamous Freight.
- [phase-1-branding-plan.md](./phase-1-branding-plan.md) — Phase 1 branding plan.
- [INFAMOUS_FREIGHT_REQUIRED_SETUP.md](./INFAMOUS_FREIGHT_REQUIRED_SETUP.md) — Required GitHub, local, and deployment setup guardrails.
- [local-setup.md](./local-setup.md) — Local development setup for the pnpm monorepo.
- [customization-checklist.md](./customization-checklist.md) — Branding, env, and integration checklist.
- [github-agent-build-brief.md](./github-agent-build-brief.md) — Build brief for the GitHub coding agent.
- [next-action.md](./next-action.md) — Current next step for the platform.

## 🏗️ Architecture & API

- [ARCHITECTURE.md](./ARCHITECTURE.md) — High-level system architecture.
- [ARCHITECTURE_SOURCE_OF_TRUTH.md](./ARCHITECTURE_SOURCE_OF_TRUTH.md) — Canonical architecture reference.
- [API-REFERENCE.md](./API-REFERENCE.md) — REST API reference.
- [API_ROUTE_MAP.md](./API_ROUTE_MAP.md) — Map of API routes to handlers.
- [AUTHORIZATION_MIGRATION_PLAN.md](./AUTHORIZATION_MIGRATION_PLAN.md) — AuthZ migration plan.
- [PHASE_1_DATABASE_SCHEMA_COMPLETION.md](./PHASE_1_DATABASE_SCHEMA_COMPLETION.md) — Database schema completion notes.

## 🚀 Launch & Readiness

- [PLATFORM_VERIFICATION_RUNBOOK.md](./PLATFORM_VERIFICATION_RUNBOOK.md) — Full-platform verification runbook.
- [PLATFORM_VERIFICATION_BLOCKER_REGISTER.md](./PLATFORM_VERIFICATION_BLOCKER_REGISTER.md) — Current verification blocker register.
- [LAUNCH_EVIDENCE_TEMPLATE.md](./LAUNCH_EVIDENCE_TEMPLATE.md) — Repeatable launch evidence template.
- [CAPABILITY_STATUS_MAP.md](./CAPABILITY_STATUS_MAP.md) — Live/beta/planned status for every platform capability.
- [LAUNCH_READINESS_INDEX.md](./LAUNCH_READINESS_INDEX.md) — Index of launch-readiness artifacts.
- [LAUNCH-READINESS-CHECKLIST.md](./LAUNCH-READINESS-CHECKLIST.md) — Pre-launch checklist.
- [LAUNCH_EVIDENCE_LOG.md](./LAUNCH_EVIDENCE_LOG.md) — Evidence log for launch checks.
- [LAUNCH_BLOCKER_TEMPLATE.md](./LAUNCH_BLOCKER_TEMPLATE.md) — Template for filing launch blockers.
- [PHASE_5_LAUNCH_VALIDATION.md](./PHASE_5_LAUNCH_VALIDATION.md) — Phase 5 validation notes.
- [INFAMOUS_FREIGHT_MVP_BUILD_PLAN.md](./INFAMOUS_FREIGHT_MVP_BUILD_PLAN.md) — MVP build plan.
- [MVP_LAUNCH_DEMO_DATA_SET.md](./MVP_LAUNCH_DEMO_DATA_SET.md) — Demo data set for MVP launch.
- [REPO-ACCURATE-STATUS.md](./REPO-ACCURATE-STATUS.md) — Current repo status.
- [launch/](./launch) — Additional launch artifacts.

## 🛠️ Production Operations

- [PRODUCTION-LAUNCH-RUNBOOK.md](./PRODUCTION-LAUNCH-RUNBOOK.md) — Production launch runbook.
- [PRODUCTION_HARDENING_EXECUTION_PLAN.md](./PRODUCTION_HARDENING_EXECUTION_PLAN.md) — Hardening execution plan.
- [PRODUCTION_DASHBOARD_REMAINING_WORK.md](./PRODUCTION_DASHBOARD_REMAINING_WORK.md) — Production dashboard and billing follow-up.
- [PRODUCTION_READINESS_VERIFICATION.md](./PRODUCTION_READINESS_VERIFICATION.md) — Readiness verification.
- [PRODUCTION_TEST_DATA_PLAN.md](./PRODUCTION_TEST_DATA_PLAN.md) — Production test-data plan.
- [production-operations/LEGAL_BUSINESS_RECORD_UPDATE.md](./production-operations/LEGAL_BUSINESS_RECORD_UPDATE.md) — Legal-name update checklist.
- [production-operations/WEEKLY_EXECUTION_SOP.md](./production-operations/WEEKLY_EXECUTION_SOP.md) — Weekly backup, report, leads, posts, invoices SOP.
- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) — Rollback procedures.
- [BACKUP_RESTORE_VERIFICATION.md](./BACKUP_RESTORE_VERIFICATION.md) — Backup/restore verification.
- [ADMIN_RECOVERY_RUNBOOK.md](./ADMIN_RECOVERY_RUNBOOK.md) — Admin recovery runbook.
- [NOTIFICATION_DELIVERABILITY_VERIFICATION.md](./NOTIFICATION_DELIVERABILITY_VERIFICATION.md) — Notification deliverability checks.
- [operations/](./operations) — Operational runbooks.
- [production-operations/](./production-operations) — Production-operations references.

## 🔐 Security, Secrets & Compliance

- [SECRETS-GUIDE.md](./SECRETS-GUIDE.md) — How to manage secrets.
- [PRODUCTION-SECRETS-CHECKLIST.md](./PRODUCTION-SECRETS-CHECKLIST.md) — Production secrets checklist.
- [INTEGRATIONS-AND-SECRETS.md](./INTEGRATIONS-AND-SECRETS.md) — Integration & secret references.
- [SBOM-POLICY.md](./SBOM-POLICY.md) — Software bill-of-materials policy.
- [SBOM-LICENSE-TRIAGE.md](./SBOM-LICENSE-TRIAGE.md) — License triage notes.
- [GITHUB-REPO-SETTINGS-CHECKLIST.md](./GITHUB-REPO-SETTINGS-CHECKLIST.md) — GitHub settings checklist.

## 💳 Billing & Payments

- [STRIPE-SETUP.md](./STRIPE-SETUP.md) — Stripe setup guide.
- [STRIPE_BILLING_AUTOMATION.md](./STRIPE_BILLING_AUTOMATION.md) — Billing automation reference.
- [STRIPE_WEBHOOK_VERIFICATION.md](./STRIPE_WEBHOOK_VERIFICATION.md) — Webhook verification.
- [PAYWALL.md](./PAYWALL.md) — Paywall behavior.
- [payments/](./payments) — Payments references.

## ☁️ Infrastructure & Deployment

- [ANALYTICS_DECISION.md](./ANALYTICS_DECISION.md) — Analytics provider decision.
- [CUSTOM-DOMAIN.md](./CUSTOM-DOMAIN.md) — Custom-domain setup.
- [CURRENT_RECOMMENDATIONS_UPDATE.md](./CURRENT_RECOMMENDATIONS_UPDATE.md) — Current launch recommendations.
- [digitalocean-lptms-deployment.md](./digitalocean-lptms-deployment.md) — DigitalOcean deployment guidance.
- [NETLIFY-BUILDHOOKS.md](./NETLIFY-BUILDHOOKS.md) — Netlify build hooks.
- [netlify-deploy-checklist.md](./netlify-deploy-checklist.md) — Netlify deploy checklist.
- [PRODUCTION_DEPLOYMENT_WORKFLOW.md](./PRODUCTION_DEPLOYMENT_WORKFLOW.md) — GitHub Actions production deploy workflow.
- [MANUS-PRODUCTION-BUILD-PACKAGE.md](./MANUS-PRODUCTION-BUILD-PACKAGE.md) — Production build package notes.

## 🧰 Developer Environment

- [CODEX_ENVIRONMENT.md](./CODEX_ENVIRONMENT.md) — Codex environment notes.
- [CODEX_EXECUTION_PACKAGE.md](./CODEX_EXECUTION_PACKAGE.md) — Codex execution loop and verification checklist.
- [REQUIRED-CLIS.md](./REQUIRED-CLIS.md) — Required CLIs.
- [environment/](./environment) — Environment configuration references.
- [GitHub Copilot custom instructions](../.github/copilot-instructions.md) — Repo-wide guidance for Copilot.

## 📈 Go-To-Market

- [sales-playbook-get-3-customers.md](./sales-playbook-get-3-customers.md) — Early-customer sales playbook.

## 🖼️ Assets

- [screenshots/](./screenshots) — Screenshots and diagrams referenced from other docs.

---

> **Maintaining this index:** when adding a new doc to `docs/`, please add it to the appropriate section above. When archiving or removing a doc, update or remove its entry here.
