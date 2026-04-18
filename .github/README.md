# 🚛 Infamous Freight

Infamous Freight is an AI-powered freight operations platform for dispatch automation, shipment tracking, fleet coordination, and logistics intelligence.

Built as a `pnpm` monorepo, the platform includes API, web, mobile, and shared package surfaces for modern logistics operations.

---

## ⚡ Quick Start

```bash
git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight

corepack enable
corepack prepare pnpm@10.33.0 --activate

cp .env.example .env
pnpm install
pnpm build
pnpm dev:api
```

---

## 📌 Current Status

### ✅ Implemented

- 📦 `pnpm` monorepo workspace structure
- 🧩 API, web, mobile, and shared package surfaces
- 🗄️ Prisma, PostgreSQL, and Redis-backed platform foundations
- 🧪 validation, linting, typechecking, testing, and audit workflows
- 🛠️ local infrastructure helpers and deployment documentation
- 🔁 CI/CD, security scanning, and release governance

### 🚧 In Progress

- 🚚 dispatch workflow logic
- 📍 shipment lifecycle services
- 🤖 AI orchestration capabilities
- 📱 mobile operations experience
- 📈 platform expansion areas under `docs/platform-expansion/`

---

## 🎯 Why It Exists

Freight operations often rely on fragmented tools, manual coordination, delayed updates, and limited visibility across the shipment lifecycle.

Infamous Freight is designed to centralize those workflows into a single logistics operating system for carriers, dispatch teams, and logistics operators.

---

## 🧠 Core Capabilities

- 🚚 Dispatch workflow automation
- 📦 Shipment lifecycle tracking
- 🚛 Fleet coordination and monitoring
- 🗺️ Routing and operational analytics
- 👨‍✈️ Driver workflow support
- 🤖 AI-assisted operational insights

---

## 📸 Screenshots

### 🖥️ Infamous Freight Landing Page
![Infamous Freight Landing Page](docs/screenshots/infamousfreight-landing-page.png)

### 📊 Platform Overview
![Infamous Freight Platform Overview](docs/screenshots/infamousfreight-platform-overview.png)

---

## 🧩 Platform Surfaces

### 🚛 Infamous Freight
**🏷️ Core product**

The primary logistics platform for managing freight operations across dispatch, tracking, routing, and fleet activity.

### 🤖 Genesis Avatar
**🧠 AI interface layer**

A conversational interface for interacting with operational data, workflows, and logistics intelligence across platform surfaces.

### 🏗️ Platform Infrastructure
**🔐 Shared foundation**

Supporting infrastructure for authentication, tenant isolation, observability, orchestration, and shared domain models.

---

## 🗂️ Monorepo Structure

```text
apps/
  api/        Backend logistics engine
  web/        Operations dashboard
  mobile/     Mobile operations interface

packages/
  shared/     Shared schemas, utilities, and domain models
```

> 📝 This overview highlights the primary product surfaces. Additional internal workspaces such as `apps/ai`, `apps/worker`, and `packages/genesis` may also exist in the monorepo.

---

## 🧱 Surface Responsibilities

| Surface | Purpose |
|---|---|
| `apps/api` | 🚚 Platform orchestration and logistics engine |
| `apps/web` | 📊 Operations dashboard and control plane |
| `apps/mobile` | 📱 Field operations interface |
| `packages/shared` | 🧩 Shared types, schemas, constants, and utilities |

---

## 📍 Repository Boundaries

To keep onboarding clear in a large repository:

- 📁 `apps/*` and `packages/*` are the primary product workspaces
- 🏗️ `infra/*` contains deployment and infrastructure assets
- 🧪 top-level experiments or prototypes outside core workspaces should be treated as non-core unless explicitly tied to active roadmap work

When opening a PR, make it clear whether the change targets:

1. 🚛 Core product workspace
2. 🏗️ Platform infrastructure
3. 🧪 Experimental or incubating surfaces

---

## 🛠️ Technology Stack

### 🖥️ Backend
- 🟢 Node.js
- 🚂 Express
- 🧬 Prisma ORM
- 🐘 PostgreSQL
- ⚡ Redis

### 🎨 Frontend
- ▲ Next.js
- 🔷 TypeScript
- 🌬️ Tailwind CSS

### 📱 Mobile
- ⚛️ React Native
- 🚀 Expo

### ☁️ Infrastructure
- 🐳 Docker
- 🧰 GitHub Actions
- 🔍 CodeQL
- 🛡️ Security audit pipelines

---

## 📏 Engineering Standards

This repository enforces:

- 🟢 Node.js 24.x
- 📦 `pnpm` 10.x
- 🧩 workspace-based development
- ✅ shared validation and domain contracts
- 🔎 dependency auditing
- 🚦 release smoke checks
- 🔁 CI-based build, lint, typecheck, and test gates

---

## 🧪 Common Commands

```bash
pnpm install          # install workspace dependencies
pnpm dev:api          # run API in dev mode
pnpm dev:web          # run web dashboard
pnpm dev:mobile       # run mobile app
pnpm build            # generate Prisma client (offline-safe) + build workspaces
pnpm lint             # lint all workspaces
pnpm typecheck        # strict TypeScript checks
pnpm test             # run workspace tests serially
pnpm health           # lint + typecheck + test
pnpm validate         # full build + typecheck + lint + test
pnpm audit            # dependency audit
pnpm audit:prod       # production dependency audit
```

---

## 🚀 Getting Started

### 📥 Clone the Repository

```bash
git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight
```

### 📦 Enable pnpm via Corepack

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

### 🔁 Reproducible Local Setup (NVM + pnpm)

To match CI and local automation, use the repository-configured Node version before installing dependencies:

```bash
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
else
  echo "NVM is required for this setup. Install it first: https://github.com/nvm-sh/nvm#installing-and-updating" >&2
  exit 1
fi

nvm install 24
nvm use 24

corepack enable
corepack prepare pnpm@10.33.0 --activate

node -v
pnpm -v
```

### 🔐 Copy Environment Variables

```bash
cp .env.example .env
```

### 📦 Install Dependencies

```bash
pnpm install
```

> ⚠️ Runtime requirement: this repository enforces Node.js 24.x. If your local runtime does not match the pinned version, `pnpm` may fail with `ERR_PNPM_UNSUPPORTED_ENGINE`.

If that happens:

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
```

### 🗄️ Initialize Database Tooling for Local Development

```bash
createdb infamous_freight
pnpm prisma:generate
pnpm db:migrate
```

### 🏗️ Build the Workspace

```bash
pnpm build
```

---

## 💻 Development

Canonical developer workflows use `pnpm` scripts. `make` targets are convenience wrappers around the same flows.

### 🔄 Recommended Daily Flow

```bash
pnpm install
pnpm dev:api
pnpm lint
pnpm typecheck
pnpm test
```

### 🚚 API

```bash
pnpm dev
```

or

```bash
pnpm dev:api
```

### 🖥️ Web Dashboard

```bash
pnpm dev:web
```

### 📱 Mobile App

```bash
pnpm dev:mobile
```

---

## 🧰 Local Infrastructure

Infamous Freight includes a local development environment with:

- 🐘 PostgreSQL
- ⚡ Redis
- 📦 API container

### ▶️ Start Infrastructure

```bash
make infra-up
```

### 📜 View Logs

```bash
make infra-logs
```

### 🧪 Run the Smoke Test

```bash
make smoke
```

### ⏹️ Stop Infrastructure

```bash
make infra-down
```

The smoke test validates the `/health` endpoint to confirm that platform services are running correctly.

---

## ✅ Validation

Before opening a pull request, run the validation suite:

```bash
pnpm run validate
```

Or step by step:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

CI enforces baseline coverage thresholds for coverage-enabled test suites.

---

## 🧭 Runtime Policy

- 🟢 Required runtimes: Node.js 24.x and Python 3.12.x
- 📦 Required package manager: `pnpm` 10.x
- 📚 Source of truth: `.nvmrc`, `.node-version`, `.python-version`, `.tool-versions`, and root `package.json`

If your local environment does not match these versions, switch before running installs or checks.

---

## 🪛 Makefile Commands

```bash
make install
make build
make typecheck
make lint
make test
make validate
make dev
make infra-up
make infra-down
make infra-logs
make smoke
```

---

## 🏛️ Architecture

Architecture documentation is available at:

```text
docs/ARCHITECTURE.md
```

### 🔄 Platform Model

```text
Client (Web / Mobile)
       │
       ▼
API Gateway
       │
       ▼
AI Orchestration Layer
       │
       ▼
Business Logic Engine
       │
       ▼
Data Layer (PostgreSQL + Redis)
```

---

## 📈 Platform Expansion Areas

The next major build phase is documented under:

```text
docs/platform-expansion/
```

Included areas:

1. 📊 Observability and monitoring
2. 📘 OpenAPI documentation
3. 🧪 Testing strategy
4. 📱 Mobile app scaffolding
5. 🌍 Multi-region and data residency
6. 🧰 Developer portal and webhook debugger

Start with:

```text
docs/platform-expansion/README.md
```

---

## 🚚 Deployment

Deployment guidance lives in:

```text
docs/DEPLOYMENT.md
```

It includes:

- ⚙️ environment setup
- 🔐 secret management
- 🚀 release procedures
- 📋 operational expectations

---

## 🛡️ Release Governance

Release procedures are documented in:

```text
docs/RELEASE.md
```

This checklist includes:

- ✅ CI verification
- 🧪 environment validation
- ↩️ rollback strategy
- 🚦 smoke testing
- 📡 post-release monitoring

---

## 🔁 CI/CD

The repository uses a focused workflow set to keep feedback clear and reduce duplication.

Key workflows include:

- `ci.yml` — 🏗️ build, lint, typecheck, test
- `codeql.yml` — 🔍 security scanning
- `security-audit.yml` — 🛡️ dependency audits
- `cd.yml` — 🚚 deployment workflow

Additional workflows may exist under `.github/workflows/` for deploy, security, and end-to-end support.

---

## 🔒 Security

Security expectations include:

- 🚫 never commit secrets
- ✅ validate all external inputs
- 🧱 maintain RBAC and tenant boundaries
- 🔐 store production credentials in managed secret stores

---

## 🤝 Contributing

See `CONTRIBUTING.md`.

### ✅ Pull Request Checklist

Before submitting a PR:

- ✅ build passes
- ✅ lint passes
- ✅ tests pass
- ✅ validation passes

### 🌿 Branch Naming Examples

- `feature/dispatch-engine`
- `feature/shipment-tracking`
- `fix/api-timeout`
- `docs/readme-update`

### 📝 Commit Format

This repository follows Conventional Commits.

Examples:

- `feat: add shipment tracking API`
- `fix: resolve pnpm workspace dependency issue`
- `docs: update architecture documentation`

### 📎 Contributor Guidelines

When contributing:

- 🎯 keep pull requests focused
- 🚫 avoid unrelated file changes
- 📝 document operational changes
- 📸 include logs or screenshots when helpful

---

## 🎯 Goal

The goal is simple: predictable, repeatable, production-grade logistics software.
