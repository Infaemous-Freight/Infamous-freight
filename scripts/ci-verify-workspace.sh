#!/usr/bin/env bash
set -euo pipefail

mkdir -p .ci
log_file=".ci/verify-workspace.log"
summary_file=".ci/verify-summary.md"
: > "${log_file}"
: > "${summary_file}"

log() {
  printf '%s\n' "$*" | tee -a "${log_file}"
}

run_step() {
  local label="$1"
  shift

  log ""
  log "== ${label} =="
  log "Command: $*"

  local started
  started="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log "Started: ${started}"

  if "$@" 2>&1 | tee -a "${log_file}"; then
    local finished
    finished="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    log "Finished: ${finished}"
    log "Result: PASS"
    printf -- '- ✅ %s\n' "${label}" >> "${summary_file}"
  else
    local status=$?
    local failed_at
    failed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    log "Failed: ${failed_at}"
    log "Result: FAIL (${status})"
    printf -- '- ❌ %s — exit %s\n' "${label}" "${status}" >> "${summary_file}"
    return "${status}"
  fi
}

{
  echo '# Verify workspace diagnostics'
  echo
  echo "- Commit: ${GITHUB_SHA:-unknown}"
  echo "- Ref: ${GITHUB_REF:-unknown}"
  echo "- Actor: ${GITHUB_ACTOR:-unknown}"
  echo "- Run ID: ${GITHUB_RUN_ID:-unknown}"
  echo "- Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  echo '## Steps'
} > "${summary_file}"

log '== Environment inventory =='
log "Node: $(node --version 2>/dev/null || echo unavailable)"
log "pnpm: $(pnpm --version 2>/dev/null || echo unavailable)"
log "npm: $(npm --version 2>/dev/null || echo unavailable)"
log "OS: $(uname -a)"
log "Working directory: $(pwd)"
log "Git SHA: ${GITHUB_SHA:-unknown}"
log "Git ref: ${GITHUB_REF:-unknown}"

run_step 'Install dependencies' pnpm install --frozen-lockfile
run_step 'Validate Prisma versions' pnpm run check:prisma-versions
run_step 'Check frontend environment safety' pnpm run env:check:frontend
run_step 'Check Supabase client environment' pnpm run env:check:supabase-client
run_step 'Check Fly + Docker deployment invariants' bash scripts/check-fly-docker-config.sh
run_step 'Codex environment check' pnpm run codex:env-check
run_step 'Typecheck' pnpm run typecheck
run_step 'Lint' pnpm run lint
run_step 'Validate Prisma schema' pnpm run prisma:validate
run_step 'Test' pnpm run test
run_step 'Build workspace' env SENTRY_DISABLE_UPLOAD=true pnpm run build

log ''
log 'All verify workspace steps passed.'
{
  echo
  echo '## Result'
  echo
  echo 'All verify workspace steps passed.'
  echo
  echo "- Finished: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} >> "${summary_file}"
