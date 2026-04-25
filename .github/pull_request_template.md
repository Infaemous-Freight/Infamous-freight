## Summary

Describe what changed and why.

## Type of change

- [ ] Feature
- [ ] Fix
- [ ] Docs
- [ ] Chore
- [ ] Security
- [ ] Deployment / infrastructure

## Validation

Paste the commands you ran and the result.

```bash
npm run lint
npx tsc -p apps/api/tsconfig.json --noEmit
npx tsc -p apps/web/tsconfig.json --noEmit
npm --prefix apps/api run test:coverage
```

## Production impact

- [ ] No production impact
- [ ] Requires deploy
- [ ] Requires env/secrets change
- [ ] Requires migration
- [ ] Requires smoke test

If production-impacting, document:

- affected service:
- required secrets/env vars:
- rollback plan:
- smoke-test evidence:

## Checklist

- [ ] Branch is up to date with `main`.
- [ ] PR is focused and not carrying stale duplicate work.
- [ ] CI is green.
- [ ] Docs were updated where needed.
- [ ] Secrets were not committed.
- [ ] Screenshots/logs are included when useful.
- [ ] Linked issue is included when applicable.