# Release Checklist

## Pre-Release

- [ ] Pass all CI checks: typecheck, lint, build, audit, test.
- [ ] Verify environment variable changes:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `JWT_SECRET`
- [ ] Review changes to workflows or dependencies for security.
- [ ] Verify rollback target before release.

## Release Process

1. Run `node scripts/release-version.js` to bump/create the root `package.json` version using semantic versioning.
2. Tag the release: `git tag -a v<version> -m "Release <version>"`.
3. Push changes: `git push && git push --tags`.
4. Publish release and changelog:
   - Generate and review the changelog (e.g. via `git log --oneline <prev-tag>..HEAD`).
   - Include full migration and rollback notes.

## Post-Release

- [ ] Confirm application health (`/api/health` — or `/health` if routed via proxy as documented in `docs/smoke-health.md`) in staging and production.
- [ ] Monitor logs for errors or regressions.
- [ ] Validate new metrics or changes in behavior.
