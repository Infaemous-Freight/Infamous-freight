# Infamous Freight

[![CI](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml) [![CodeQL](https://github.com/MrMiless44/Infamous-freight/actions/workflows/codeql.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/codeql.yml) [![Security Audit](https://github.com/MrMiless44/Infamous-freight/actions/workflows/security-audit.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/security-audit.yml)

## About

 The **Infamous Freight** repository powers a cutting-edge AI-driven freight operations platform. It's enterprise-ready and emphasizes dispatch, fleet intelligence, and driver coaching.

Built as a `pnpm` monorepo, this repository spans backend services, frontend apps, and mobile solutions tailored for seamless logistics management.

### Key Features:
1. AI-Powered Dispatch: Enhances productivity by automating load assignments.
2. Fleet Intelligence: Offers actionable insights for route optimization and maintenance planning.
3. Driver Coaching: Personalized driver performance improvement through analytics.

---

### Monorepo Layout:
```plaintext
apps/
  api/       Express API for backend processing.
  web/       Operations Dashboard powered by Next.js.
  mobile/    Cross-platform app on React Native with Expo.

packages/
  shared/    Workspace for types, configs, and utility functions.
```

---

### Developer Tooling
#### Requirements:
- Node: 22.x
- pnpm: 9.x

#### Configuration Pins:
- Node.js: Version `22.x`
- pnpm version: `9.x`
- `packageManager`: `pnpm@9.15.0`

---
## Setting Up Locally:
```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate

git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight

cp .env.example .env
pnpm install
pnpm build
```
#### Environment Variables:
- Secrets should remain in `.env` and never surface in workflows, commits, or scripts to CI stations.

---

## Development Scripts
#### API:
```bash
pnpm dev
# Optional:
# Direct, API-only invoke
pnpm dev:api
```
#### Web:
```bash
pnpm dev:web
```
#### Mobile:
```bash
pnpm dev:mobile
```

---

### **Developer Checklist: Get Code Merged on Enterprise Rigs. Successful & Rejectable CLI the milestones Fulfilled!!. Thank.