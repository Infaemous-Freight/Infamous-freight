# Changelog

All notable changes to INFÆMOUS FREIGHT should be documented in this file.

This project follows a practical changelog format focused on production readiness, operator impact, and release evidence.

## Unreleased

### Added

- Product-first README positioning for INFÆMOUS FREIGHT.
- Runtime readiness snapshot in README and `docs/current-status.md`.
- Production smoke testing checklist.
- Screenshot capture checklist.
- Product roadmap documentation.
- Support and community governance documentation.

### Changed

- README now points to `docs/current-status.md` as the runtime source of truth.
- README route list now aligns with `apps/web/src/lib/routeReadiness.ts`.
- README stack language now distinguishes the active Prisma-backed API runtime from any Drizzle/Netlify Database form-submission assets.

### Documentation

- Added launch-readiness framing for web, API, billing, public tracking, public intake, operator routes, mobile, and AI dispatch automation.
- Added safer guidance around demo-backed operational surfaces.

## Release note template

Use this template for future entries:

```md
## YYYY-MM-DD — Release name

### Added

- ...

### Changed

- ...

### Fixed

- ...

### Security

- ...

### Verification

- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run test`
- production smoke evidence link or note
```
