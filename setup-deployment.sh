#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "==> Initializing Node + pnpm runtime"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.33.0 --activate

echo "==> Runtime versions"
node -v
pnpm -v

echo "==> Installing workspace dependencies"
pnpm install --frozen-lockfile

echo "==> Validating deployment files"
for file in \
  ".github/workflows/deploy.yml" \
  "fly.api.toml" \
  "netlify.toml" \
  "Dockerfile.api"
do
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
  echo "  - found $file"
done

echo "==> Next steps"
echo "1) Set GitHub Actions secrets: FLY_API_TOKEN, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID"
echo "2) Push to trigger .github/workflows/deploy.yml"
