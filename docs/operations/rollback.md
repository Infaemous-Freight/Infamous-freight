# Rollback Procedure

If a production deployment fails:

1. Identify the last stable release tag.

Example:

```bash
git tag
```

2. Redeploy the previous version.

Example:

```bash
git checkout v1.2.3
flyctl deploy -c fly.toml -a infamous-freight-db --remote-only --depot=false
```

3. Restore database snapshot if migration caused failure.

4. Verify:

- API health endpoint
- load board functionality
- shipment tracking
- auth system

5. Monitor logs and error rates.
