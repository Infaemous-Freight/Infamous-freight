#!/usr/bin/env bash
set -euo pipefail

echo "=== Regenerating pnpm-lock.yaml ==="
echo "Step 1: Install pnpm 8.15.9"
npm install -g pnpm@8.15.9 || sudo npm install -g pnpm@8.15.9

echo "Step 2: Verify pnpm version"
pnpm --version

echo "Step 3: Run pnpm install to regenerate lockfile"
pnpm install

echo "Step 4: Verify shared package builds"
pnpm --filter @infamous-freight/shared build

echo "Step 5: Verify web package builds"
pnpm --filter infamous-freight-web build

echo "Step 6: Stage pnpm-lock.yaml"
git add pnpm-lock.yaml

echo "Step 7: Commit with descriptive message"
git commit -m "chore: regenerate pnpm-lock.yaml for Speed Insights + Datadog RUM + Node 20.18.1 engines

- Added @vercel/speed-insights for web performance monitoring
- Added @datadog/browser-rum for observability
- Pinned Node.js engines to 20.18.1
- All transitive dependencies resolved for Vercel build"

echo "Step 8: Push to main branch"
git push origin main

echo "✅ Lockfile regenerated and pushed. Vercel will rebuild automatically."
