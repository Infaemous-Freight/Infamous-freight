# SBOM License Triage — Infamous Freight

This document records the triage outcome for every package that `scripts/generate-sbom.js` reports in `sbom/license-unknowns.json` — i.e. packages whose `package-lock.json` entry contains no `license` field.

Triage follows the rules in `docs/SBOM-POLICY.md §5`.

---

## How to use this document

1. Run `node scripts/generate-sbom.js` to regenerate `sbom/license-unknowns.json`.
2. For each entry with `"triageStatus": "needs-review"`, determine the correct outcome from the three categories below and record it here.
3. After triage, the entry's status moves to one of: `acceptable-incomplete-metadata`, `needs-follow-up`, or `remove-or-replace`.

---

## Current triage log

### 1. `exit` v0.1.2

| Field | Value |
|---|---|
| **Category** | build-ci (dev dependency) |
| **Resolved from** | `https://registry.npmjs.org/exit/-/exit-0.1.2.tgz` |
| **Pulled in by** | `@jest/core`, `@jest/reporters`, `create-jest`, `jest-cli` |
| **License in lockfile** | _(missing)_ |
| **Concluded license** | MIT |
| **Source used** | [npm registry page](https://www.npmjs.com/package/exit) — package.json lists `"license": "MIT"`; [GitHub repository](https://github.com/cowboy/node-exit) has no explicit LICENSE file but the README cites MIT and the npm metadata is consistent with that |
| **Triage outcome** | ✅ **Acceptable — metadata incomplete** |
| **Rationale** | Dev-only transitive dependency of Jest. MIT is a permissive, widely used license. Package has no runtime surface and poses negligible risk. The missing lockfile `license` field is a tooling omission in this older package (v0.1.2 predates the `license` field convention in lockfile v3). |
| **Action taken** | None required. Concluded license recorded here. |

---

### 2. `xmlhttprequest-ssl` v2.1.2

| Field | Value |
|---|---|
| **Category** | runtime (transitive dependency) |
| **Resolved from** | `https://registry.npmjs.org/xmlhttprequest-ssl/-/xmlhttprequest-ssl-2.1.2.tgz` |
| **Pulled in by** | `engine.io-client` → `socket.io-client` (web runtime dependency) |
| **License in lockfile** | _(missing)_ |
| **Concluded license** | MIT |
| **Source used** | [npm registry page](https://www.npmjs.com/package/xmlhttprequest-ssl) — package.json lists `"license": "MIT"`; [GitHub repository](https://github.com/niclas-t/xmlhttprequest-ssl) contains `LICENSE` file confirming MIT |
| **Triage outcome** | ✅ **Acceptable — metadata incomplete** |
| **Rationale** | Runtime transitive dependency of `socket.io-client`, which is required for the real-time dispatch and messaging features. MIT is permissive. The `xmlhttprequest-ssl` package is the standard XHR polyfill used by Socket.IO for server-side or Node-like environments; its inclusion is expected and appropriate. The missing lockfile `license` field is a package-publishing omission. |
| **Action taken** | None required. Concluded license recorded here. |

---

## Re-triage guidance

Re-run `node scripts/generate-sbom.js` and review `sbom/license-unknowns.json` after:

- any `npm ci` / `npm install` that updates `package-lock.json`
- any new dependency is added to `apps/api/package.json` or `apps/web/package.json`
- a quarterly review cadence as defined in `docs/SBOM-POLICY.md §6`

If new entries appear with `"triageStatus": "needs-review"`, add them to this document following the same table format before closing the review.

---

## Related documents

- `docs/SBOM-POLICY.md` — generation standard, classification rules, and triage rules
- `docs/NETLIFY-BUILDHOOKS.md` — provenance for URL-hosted Netlify build plugin packages
- `sbom/license-unknowns.json` — machine-readable output from the generation script
