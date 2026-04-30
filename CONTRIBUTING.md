<p align="center">
  <a href="https://infamousfreight.com" target="_blank" rel="noopener noreferrer">
    <img src="/docs/screenshots/infamousfreight-header.svg" alt="Infamous Freight" width="100%">
  </a>
</p>

# Contributing

This repository uses a small, strict workflow so production work stays clean and traceable.

## Required workflow

1. Create a fresh branch from current `main`.
2. Keep the change focused.
3. Run validation before opening a PR.
4. Open a pull request into `main`.
5. Wait for CI to pass.
6. Squash merge.
7. Delete the branch after merge.

## Branch naming

Use clear prefixes:

```text
feature/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
security/<short-description>
```

Avoid reviving stale Codex/Copilot branches. Cherry-pick unique work into a fresh branch from `main` instead.

## Local validation

Run from the repository root:

```bash
npm ci
npm run lint
npx tsc -p apps/api/tsconfig.json --noEmit
npx tsc -p apps/web/tsconfig.json --noEmit
npm --prefix apps/api run test:coverage
```

If available, run the repo validator:

```bash
npm run validate
```

## Pull request requirements

Every PR should include:

- what changed
- why it changed
- validation evidence
- screenshots or logs when relevant
- environment or secret changes, if any
- linked issue, if applicable

## Production changes

Production-impacting changes must identify:

- affected service
- deployment workflow
- required secrets
- rollback plan
- smoke-test evidence

Do not mark production ready until required health checks pass.

## Commit style

Use Conventional Commits:

```text
feat: add dispatch workflow
fix: correct API health check
chore: update CI runtime
docs: add launch checklist
security: tighten CORS policy
```

## Secrets

Never commit secrets, tokens, private keys, credentials, `.env` files, or screenshots containing secrets. If a secret is exposed, rotate it immediately and open a blocker issue.