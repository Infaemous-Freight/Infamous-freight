# Validation Guide

This guide documents the validation and quality gates used across the Infamous Freight Enterprise monorepo. All validators are configured under `configs/` and executed through top-level scripts for consistency.

## Quick Commands

- **Run all file validations**: `pnpm validate` (HTML, CSS, JS/TS)
- **Lint JavaScript/TypeScript only**: `pnpm lint`
- **Validate CSS only**: `pnpm lint:css`
- **Validate HTML only**: `pnpm lint:html`
- **Generate coverage reports**: `pnpm test:coverage` (uploads to Codecov in CI)

> CI automatically runs `pnpm validate`, `pnpm lint`, `pnpm test`, `pnpm test:coverage`, and uploads coverage artifacts.

## HTML Validation

- **Tool**: [`html-validate`](https://html-validate.org/)
- **Configuration**: `configs/validation/html-validate.config.js`
- **Ignores**: Node modules, build artifacts, Playwright reports, and coverage output
- **Manual run**:

  ```bash
  pnpm exec html-validate \
    --config configs/validation/html-validate.config.js \
    "src/**/*.html" "tests/**/*.html"
  ```

- **CI**: Invoked via `pnpm validate` in `.github/workflows/ci.yml`.

## CSS Validation

- **Tool**: [`stylelint`](https://stylelint.io/)
- **Configuration**: `configs/validation/stylelint.config.cjs`
- **Ignore list**: `configs/validation/.stylelintignore`
- **Manual run**:

  ```bash
  pnpm lint:css
  ```

- **CI**: Executed through `pnpm validate`.

## JavaScript/TypeScript Linting

- **Tool**: [`eslint`](https://eslint.org/)
- **Configuration**: `configs/linting/eslint.config.js`
- **Manual run**:

  ```bash
  pnpm lint
  # or with explicit paths
  pnpm exec eslint -c configs/linting/eslint.config.js "src/**/*.{js,jsx,ts,tsx}" "tests/**/*.{js,jsx,ts,tsx}"
  ```

- **Type checking**: Packages expose `typecheck` scripts where applicable and are executed in CI with `pnpm -r --if-present typecheck`.

## Coverage & Reporting

- Coverage is generated with `pnpm test:coverage` (workspace-aware).
- `.github/workflows/ci.yml` uploads `lcov.info` artifacts to Codecov using `codecov/codecov-action`.
- Coverage path filters are defined in `codecov.yml` for API and Web targets.

## Where Configurations Live

- **Testing**: `configs/testing/playwright.config.js`
- **Validation**: `configs/validation/` (HTML/CSS rules and ignores)
- **Linting**: `configs/linting/eslint.config.js`

Keep these locations in sync when adding new validators to ensure local and CI environments share the same rules.
