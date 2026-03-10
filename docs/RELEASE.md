# Release Checklist

## Pre-Release
- [ ] Pass all CI checks: typecheck, lint, build, audit, test.
- [ ] Verify environment variable changes:
  - `DATABASE_URL`
  - `REDIS_URL`
- [ ] Review workflow and dependency changes for security impact.
- [ ] Verify the rollback target before release.
- [ ] Confirm database migration plan and rollback path.

## Release Process

### Normal (automated) release
1. Once the Pre-Release checklist is complete, merge the release PR into the `main` branch.
2. A push to `main` triggers `.github/workflows/release.yml`, which uses `scripts/release-version.js` to:
   - bump the version in `package.json` using semantic versioning,
   - create and push a `v<version>` git tag, and
   - create and publish the GitHub Release.
3. After the workflow completes, review the generated GitHub Release and add migration and rollback notes as needed.
4. In normal operation, do **not** manually bump versions, create tags, or publish releases; these actions are owned by the automated workflow.

### Manual release (exception-only)
In the rare event that the automated release workflow is unavailable or intentionally disabled, a maintainer may perform a manual release. Coordinate with the release owner and ensure `.github/workflows/release.yml` will not also run for the same release to avoid duplicate tags or releases.

1. Increment the version in `package.json` using semantic versioning.
2. Tag the release:
   `git tag -a v<version> -m "Release <version>"`
3. Push commits and tags:
   `git push && git push --tags`
4. Generate or update the changelog.
5. Publish the GitHub Release with migration notes and rollback notes.

## Post-Release
- [ ] Confirm application health at `/health` in staging and production.
- [ ] Monitor logs for errors or regressions.
- [ ] Validate expected metrics and behavior changes.
- [ ] Confirm alerts, dashboards, and error tracking remain healthy.
