# Contributing to Infæmous Freight

Thank you for contributing to Infæmous Freight.

## Development Setup

Clone the repository:

```bash
git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight
```

Install dependencies:

```bash
pnpm install
```

Run development servers (choose the ones you need):

```bash
# API (apps/api)
pnpm dev:api

# Web app (apps/web)
pnpm dev:web

# Mobile app (apps/mobile)
pnpm dev:mobile
```

---

## Branching Strategy

Create feature branches from `main`.

Examples:

- `feature/load-optimization`
- `fix/api-timeout`

---

## Pull Request Rules

Before opening a pull request:

- CI must pass
- code must build
- lint checks must pass
- tests must run

PRs should include:

- a clear description
- related issue reference
- screenshots or logs if applicable

---

## Commit Style

Use conventional commits.

Examples:

- `feat: add shipment tracking API`
- `fix: resolve pnpm workspace install issue`
- `docs: update architecture section`
