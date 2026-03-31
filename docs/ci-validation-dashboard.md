# CI Validation Dashboard

This dashboard mirrors the **area × validation** model used by CI and pull requests.

## Areas

- api
- web
- shared
- ci
- security
- docs

## Validation Gates

- sanity
- lint
- typecheck
- test
- build
- codeql
- audit

## Status Matrix

| Area \ Validation | sanity | lint | typecheck | test | build | codeql | audit |
|---|---|---|---|---|---|---|---|
| api | ![pending](https://img.shields.io/badge/sanity-pending-lightgrey) | ![pending](https://img.shields.io/badge/lint-pending-lightgrey) | ![pending](https://img.shields.io/badge/typecheck-pending-lightgrey) | ![pending](https://img.shields.io/badge/test-pending-lightgrey) | ![pending](https://img.shields.io/badge/build-pending-lightgrey) | ![pending](https://img.shields.io/badge/codeql-pending-lightgrey) | ![pending](https://img.shields.io/badge/audit-pending-lightgrey) |
| web | ![pending](https://img.shields.io/badge/sanity-pending-lightgrey) | ![pending](https://img.shields.io/badge/lint-pending-lightgrey) | ![pending](https://img.shields.io/badge/typecheck-pending-lightgrey) | ![pending](https://img.shields.io/badge/test-pending-lightgrey) | ![pending](https://img.shields.io/badge/build-pending-lightgrey) | ![pending](https://img.shields.io/badge/codeql-pending-lightgrey) | ![pending](https://img.shields.io/badge/audit-pending-lightgrey) |
| shared | ![pending](https://img.shields.io/badge/sanity-pending-lightgrey) | ![pending](https://img.shields.io/badge/lint-pending-lightgrey) | ![pending](https://img.shields.io/badge/typecheck-pending-lightgrey) | ![pending](https://img.shields.io/badge/test-pending-lightgrey) | ![pending](https://img.shields.io/badge/build-pending-lightgrey) | ![pending](https://img.shields.io/badge/codeql-pending-lightgrey) | ![pending](https://img.shields.io/badge/audit-pending-lightgrey) |
| ci | ![pending](https://img.shields.io/badge/sanity-pending-lightgrey) | ![pending](https://img.shields.io/badge/lint-pending-lightgrey) | ![pending](https://img.shields.io/badge/typecheck-pending-lightgrey) | ![pending](https://img.shields.io/badge/test-pending-lightgrey) | ![pending](https://img.shields.io/badge/build-pending-lightgrey) | ![pending](https://img.shields.io/badge/codeql-pending-lightgrey) | ![pending](https://img.shields.io/badge/audit-pending-lightgrey) |
| security | ![pending](https://img.shields.io/badge/sanity-pending-lightgrey) | ![pending](https://img.shields.io/badge/lint-pending-lightgrey) | ![pending](https://img.shields.io/badge/typecheck-pending-lightgrey) | ![pending](https://img.shields.io/badge/test-pending-lightgrey) | ![pending](https://img.shields.io/badge/build-pending-lightgrey) | ![pending](https://img.shields.io/badge/codeql-pending-lightgrey) | ![pending](https://img.shields.io/badge/audit-pending-lightgrey) |
| docs | ![pending](https://img.shields.io/badge/sanity-pending-lightgrey) | ![pending](https://img.shields.io/badge/lint-pending-lightgrey) | ![pending](https://img.shields.io/badge/typecheck-pending-lightgrey) | ![pending](https://img.shields.io/badge/test-pending-lightgrey) | ![pending](https://img.shields.io/badge/build-pending-lightgrey) | ![pending](https://img.shields.io/badge/codeql-pending-lightgrey) | ![pending](https://img.shields.io/badge/audit-pending-lightgrey) |

## Usage

- Use `.github/pull_request_template.md` to declare scope and validations.
- Use `.github/workflows/validation-matrix.yml` to run the matrix on PRs.
- Keep `.github/labeler.yml` aligned with ownership and matrix areas.
