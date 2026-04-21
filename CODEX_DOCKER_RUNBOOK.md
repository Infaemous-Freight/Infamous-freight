# Codex + Docker Split Runbook

## Purpose
Use **Codex Cloud** for repository validation and use **GitHub Actions / local Docker** for image builds.

## 1) Codex Cloud setup (validation only)
Configure the Codex Cloud environment setup script to:

```bash
bash codex/cloud/setup.sh
```

This script:
- installs dependencies (`npm ci`)
- runs `prisma generate` only if `apps/api/prisma/schema.prisma` exists
- prepares the environment for lint/test/build

## 2) GitHub Actions validation
Workflow: `.github/workflows/ci-validate.yml`

Runs on PRs and pushes to `main`, `master`, and `develop`.

Primary command:

```bash
bash scripts/ci-validate.sh
```

## 3) GitHub Actions Docker build/publish
Workflow: `.github/workflows/docker-image.yml`

Behavior:
- **PRs**: Docker build only (no push)
- **Pushes to main/master and version tags**: build + publish to GHCR

Published image name:

```text
ghcr.io/<owner>/<repo>-api
```

## 4) Local Docker validation
Run locally on any machine with Docker installed:

```bash
docker build -f Dockerfile.api -t infamous-freight-api-local .
```

Then start container and validate health:

```bash
docker run --rm -p 3000:3000 infamous-freight-api-local
curl -fsS http://127.0.0.1:3000/health
```
