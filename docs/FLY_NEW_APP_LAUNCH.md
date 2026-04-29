# Launch a new Fly app from this repository

Use this when you need to create a new Fly app instance from the current repo configuration.

## Prerequisites

- `flyctl` installed
- `FLY_API_TOKEN` exported in your shell

## Command

```bash
scripts/fly-launch-new-app.sh <app-name> [region]
```

Example:

```bash
FLY_API_TOKEN=*** scripts/fly-launch-new-app.sh infamous-freight-staging iad
```

The script launches using the existing `fly.toml` shape (`--copy-config`) and deploys immediately (`--now`).

## Post-launch checks

```bash
curl -i https://<app-name>.fly.dev/health
curl -i https://<app-name>.fly.dev/api/health
```
