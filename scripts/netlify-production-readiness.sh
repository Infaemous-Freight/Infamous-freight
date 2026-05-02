#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

WEB_HEALTH_URL="${WEB_HEALTH_URL:-https://www.infamousfreight.com/api/health}"
SITE_URL="${SITE_URL:-https://www.infamousfreight.com}"
API_HEALTH_URL="${API_HEALTH_URL:-https://api.infamousfreight.com/health}"
API_HEALTH_FALLBACK_URL="${API_HEALTH_FALLBACK_URL:-https://api.infamousfreight.com/api/health}"
ALLOW_LOCKFILE_UPDATE="${ALLOW_LOCKFILE_UPDATE:-0}"

# Smoke-check curl flags aligned with .github/workflows/smoke-test.yml so that
# non-2xx responses fail the step and transient errors are retried.
SMOKE_CURL_FLAGS=(--fail --show-error --location --retry 5 --retry-delay 10 --retry-connrefused)

run_step() {
  local title="$1"
  shift
  echo ""
  echo "==> ${title}"
  "$@"
}

install_workspace_deps() {
  # Prefer a frozen install so this readiness check does not silently mutate
  # pnpm-lock.yaml. Fall back to a non-frozen install only when explicitly
  # opted in via ALLOW_LOCKFILE_UPDATE=1, mirroring scripts/workspace-pm.sh.
  if pnpm install --frozen-lockfile; then
    return
  fi

  if [[ "$ALLOW_LOCKFILE_UPDATE" == "1" ]]; then
    echo "Frozen install failed; retrying with --no-frozen-lockfile (ALLOW_LOCKFILE_UPDATE=1)." >&2
    pnpm install --no-frozen-lockfile
    return
  fi

  echo "ERROR: pnpm install --frozen-lockfile failed." >&2
  echo "Re-run with ALLOW_LOCKFILE_UPDATE=1 to permit lockfile updates, or refresh pnpm-lock.yaml first." >&2
  return 1
}

run_step "Install workspace deps (frozen lockfile)" install_workspace_deps
run_step "Prisma client generation" pnpm prisma:generate
run_step "Type/lint checks" pnpm lint
run_step "API tests (runInBand)" pnpm -w test --runInBand
run_step "Strict environment checks" pnpm env:check:strict
run_step "Web production build" pnpm -C apps/web run build
run_step "Docker build validation" pnpm docker:build

run_step "Site HEAD check" curl "${SMOKE_CURL_FLAGS[@]}" --head "$SITE_URL"
run_step "Canonical API health check" curl "${SMOKE_CURL_FLAGS[@]}" --silent "$WEB_HEALTH_URL"

echo ""
echo "==> Optional direct API domain checks"
if curl "${SMOKE_CURL_FLAGS[@]}" --silent "$API_HEALTH_URL"; then
  echo "Direct API health URL succeeded: $API_HEALTH_URL"
elif curl "${SMOKE_CURL_FLAGS[@]}" --silent "$API_HEALTH_FALLBACK_URL"; then
  echo "Direct API fallback health URL succeeded: $API_HEALTH_FALLBACK_URL"
else
  echo "WARNING: Direct API domain health checks failed (both endpoints)." >&2
  echo "Keep smoke checks pointed at ${WEB_HEALTH_URL} and verify DNS/origin routing for api.infamousfreight.com." >&2
fi

echo ""
echo "==> Optional Netlify production deploy trigger"
if [[ -n "${NETLIFY_AUTH_TOKEN:-}" && -n "${NETLIFY_SITE_ID:-}" ]]; then
  echo "Triggering deploy for site ${NETLIFY_SITE_ID} via Netlify CLI..."
  # NETLIFY_AUTH_TOKEN is read from the environment by the Netlify CLI;
  # do not pass it on the command line to avoid leaking it via process
  # listings, shell history, or CI logs.
  NETLIFY_AUTH_TOKEN="$NETLIFY_AUTH_TOKEN" \
    pnpm dlx netlify-cli deploy --prod --dir apps/web/dist --site "$NETLIFY_SITE_ID"
else
  echo "Skipped: set NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID to trigger deploy from CLI."
fi
