# Release Checklist

## Pre-Release

- [ ] Pass all CI checks: typecheck, lint, build, audit, test.
- [ ] Verify environment variable changes:
  - `DATABASE_URL`
  - `REDIS_URL`
- [ ] Review changes to workflows or dependencies for security.
- [ ] Verify rollback target before release.

## Release Process

1. Bump the version by running `node scripts/release-version.js` (this updates `package.json` using semantic versioning based on conventional commit messages; avoid manual edits).
2. Tag the release: `git tag -a v<version> -m "Release <version>"`.
3. Push changes: `git push && git push --tags`.
4. Publish release and changelog:
   - Generate changelog (e.g. using `git log`, `git diff`, `conventional-changelog`, or your team's standard tooling).
   - Include full migration and rollback notes.

## Post-Release

- [ ] Confirm application health (`/health`) in staging and production.
- [ ] Monitor logs for errors or regressions.
- [ ] Validate new metrics or changes in behavior.
