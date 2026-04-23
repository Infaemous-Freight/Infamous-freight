# Infamous Freight — SBOM Generation & Triage Policy

This document defines how this repository produces, reviews, and uses software bills of materials (SBOMs).

The goal is simple: keep runtime supply-chain review clean enough to be actionable, while still retaining visibility into build, CI, and deployment tooling.

---

## 1. Why this policy exists

A single raw SBOM generated from the monorepo lockfile can mix together:

- application runtime dependencies
- development and build-only tooling
- CI/CD actions and deployment utilities
- URL-hosted integration packages
- transitive packages with incomplete license metadata

That raw output is still useful, but it is noisy. This policy separates those concerns into clearer review buckets.

---

## 2. Required artifact types

### 2.1 Runtime application SBOM

This is the primary artifact for security and license review.

It must focus on the dependencies that materially ship with or support the running product:

- `apps/api` runtime dependencies
- `apps/web` runtime dependencies
- required transitive dependencies resolved from the lockfile

This artifact is the default input for:

- dependency risk review
- license review
- customer or partner compliance requests
- release signoff

### 2.2 Build / CI / deployment inventory

This is a separate artifact or labeled section, not a substitute for the runtime SBOM.

It covers:

- GitHub Actions workflow dependencies
- Docker build dependencies and base images
- Vercel CLI / deployment tooling
- Netlify build plugins and URL-hosted buildhook packages
- local development-only tooling

This view is used for:

- CI supply-chain hardening
- reproducibility review
- infra maintenance

### 2.3 External integration provenance inventory

This is maintained in repo docs, not only in a raw package graph.

Current canonical references:

- `docs/INTEGRATIONS-AND-SECRETS.md`
- `docs/NETLIFY-BUILDHOOKS.md`

Use those docs for ownership, update paths, and operational context that package metadata alone does not provide.

---

## 3. Generation standard

### 3.1 Source of truth

The source of truth for JavaScript dependency resolution is:

- root `package-lock.json`
- workspace `package.json` files under `apps/*`

### 3.2 Automated generation

The repository includes a generation script and a dedicated CI workflow:

```bash
# Run locally from the repo root
npm ci
node scripts/generate-sbom.js
```

This produces three output files in `sbom/`:

| File | Contents |
|---|---|
| `sbom/runtime.json` | All non-dev packages (ships with or supports the running application) |
| `sbom/build-ci.json` | All dev-flagged packages — including dev dependencies and their transitive dependency graph; build, test, lint, and CI-only packages |
| `sbom/license-unknowns.json` | Packages whose lockfile entry has no `license` field |

The CI workflow `.github/workflows/sbom.yml` runs automatically on every push to `main` that touches the lockfile or workspace `package.json` files, and quarterly on a cron schedule. It uploads the three views as workflow artifacts (retained 90 days) and emits a warning if the `license-unknowns.json` count exceeds the number of entries already triaged in `docs/SBOM-LICENSE-TRIAGE.md`.

### 3.3 Raw SPDX generation (optional)

For a standards-compliant SPDX document, use `npm sbom` directly:

```bash
npm ci
npm sbom --sbom-format spdx > sbom.spdx.json
```

If a future pipeline emits CycloneDX as well, SPDX remains the required baseline unless the compliance consumer explicitly asks for another format.

### 3.4 Review views to produce from the raw SBOM

Every formal SBOM review should produce these views:

1. **Runtime direct dependencies**
   - direct dependencies from `apps/api/package.json`
   - direct dependencies from `apps/web/package.json`

2. **Runtime transitive dependencies**
   - transitive packages reachable from runtime direct dependencies

3. **Build / CI / deployment dependencies**
   - GitHub Actions
   - Docker-related tooling
   - Netlify plugins
   - Vercel CLI and platform tooling

4. **License exceptions / unknowns**
   - packages marked `NOASSERTION`, `UNKNOWN`, or equivalent incomplete metadata

5. **Version drift / duplicate-version report**
   - duplicate versions of the same package name
   - workspace toolchain drift

---

## 4. Classification rules

### 4.1 Runtime

Classify a dependency as **runtime** when it is required by the running API or web application in production.

Examples:

- `express`
- `@prisma/client`
- `dotenv` when used by the running API process
- `react`
- `react-dom`
- `@supabase/supabase-js`
- `socket.io-client`
- `axios`

### 4.2 Build / development / CI

Classify a dependency as **build/CI** when it is used only to compile, test, lint, package, or deploy the application.

Examples:

- `typescript`
- `jest`
- `ts-jest`
- `tsx`
- `@types/*`
- `vite`
- `@vitejs/plugin-react`
- GitHub Actions workflow actions
- Vercel CLI
- Netlify build plugins

### 4.3 External URL-hosted packages

Classify a dependency as **external provenance required** when it is fetched from a non-registry URL or otherwise lacks normal package registry provenance.

Examples in this repo include Netlify buildhook tarballs under `apps/web/.netlify/plugins/`.

These packages must always have:

- owner / maintainer documented
- source artifact location documented
- update path documented
- integrity verification method documented

---

## 5. License triage rules

Any package marked with incomplete license metadata must be triaged into one of these outcomes:

### 5.1 Acceptable but metadata-incomplete

Use this when:

- the package is widely used and low risk
- the upstream package clearly has a known license outside the raw SBOM
- the SBOM tooling failed to conclude it automatically

Action:
- record the concluded license in the review notes or allowlist
- link the source used to determine that conclusion

### 5.2 Needs follow-up

Use this when:

- the package source is unclear
- the package is URL-hosted or privately distributed
- the repository cannot verify a license with confidence

Action:
- open a follow-up issue
- record owner, source, and planned resolution

### 5.3 Remove or replace

Use this when:

- the package is unused
- the package cannot be justified operationally
- provenance or licensing cannot be made acceptable

Action:
- remove it from the dependency graph or replace it with an acceptable alternative

---

## 6. Review cadence

Perform SBOM review at these times:

- before major production releases
- after dependency refresh work
- after introducing a new external integration
- after changing deployment or CI platform tooling
- during any customer or partner compliance review

At minimum, perform a full review quarterly.

---

## 7. Issue handling standard

When a review finds problems, create or update issues in these buckets:

- version drift / duplicate versions
- workflow supply-chain hardening
- provenance gaps
- license unknowns
- secrets / integration ownership gaps

Link those issues back to the current SBOM review tracker issue so the audit trail stays intact.

---

## 8. Current repository guidance

For this repository specifically:

- use the runtime SBOM for application review
- review GitHub Actions and deployment tooling separately
- treat Netlify buildhook packages as provenance-sensitive
- keep Vercel / Fly.io operational context in the integrations inventory docs
- do not treat raw `NOASSERTION` results as automatically acceptable

---

## 9. Practical checklist

Before closing an SBOM review, confirm all of the following:

- [ ] `node scripts/generate-sbom.js` was run against the current lockfile
- [ ] `sbom/runtime.json` was reviewed for unexpected packages
- [ ] `sbom/build-ci.json` was checked for incorrectly classified runtime packages
- [ ] `sbom/license-unknowns.json` is empty or all entries are recorded in `docs/SBOM-LICENSE-TRIAGE.md`
- [ ] duplicate-version drift was reviewed
- [ ] external URL-hosted packages were reviewed for provenance (`docs/NETLIFY-BUILDHOOKS.md`)
- [ ] any remediation work was opened as linked issues or PRs

---

## 10. Related documents

- `README.md`
- `docs/INTEGRATIONS-AND-SECRETS.md`
- `docs/NETLIFY-BUILDHOOKS.md`
- `docs/SBOM-LICENSE-TRIAGE.md` — triage outcomes for packages with no lockfile license metadata
- `scripts/generate-sbom.js` — generation script (runtime/build-CI split + license-unknowns report)
- `.github/workflows/sbom.yml` — CI workflow for automated SBOM generation and upload
- [SBOM remediation tracker issue](https://github.com/Infaemous-Freight/Infamous-freight/issues/1524)
