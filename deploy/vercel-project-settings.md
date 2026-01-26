# Vercel Project Settings

This guide documents the Vercel settings for the monorepo and the logic used to
skip or trigger builds.

## Vercel Ignored Build Step (Git > Ignored Build Step)

Use the following script to avoid unnecessary Vercel builds. It detects relevant
changes in the repo and exits with a non-zero status when a build is required.

```bash
#!/bin/bash
set -euo pipefail

CHANGED="$(git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA")"

if [[ -z "$CHANGED" ]]; then
  echo "No changes detected."
  exit 0
fi

echo "Changed files:"
echo "$CHANGED"

# Always build production deployments.
if [[ "$VERCEL_ENV" == "production" ]]; then
  echo "Production deployment detected. Build required."
  exit 1
fi

# Skip builds for docs-only changes.
if echo "$CHANGED" | grep -qE "^(docs/|README\.md|\.github/|\.vscode/)"; then
  echo "Documentation-only changes detected. Skipping build."
  exit 0
fi

# Trigger builds for web/app/code changes and key config updates.
if echo "$CHANGED" | grep -qE "^(web/|api/|mobile/|packages/|package\.json|pnpm-lock\.yaml|turbo\.json|tsconfig\.json|next\.config\.)"; then
  echo "Relevant changes detected. Build required."
  exit 1
fi

echo "No relevant changes detected. Skipping build."
exit 0
```

## Build & Output Settings

### Framework Preset
- **Framework**: Next.js

### Root Directory
- If Next.js is in a subfolder (example: `web`), set **Root Directory** to `web`.

### Build Settings
- **Install Command**: `pnpm install --frozen-lockfile`
- **Build Command**: `pnpm build`
- **Output Directory**: `.next` (auto-detected by Vercel)
