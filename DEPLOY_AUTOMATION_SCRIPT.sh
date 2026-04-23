#!/bin/bash

################################################################################
# Infæmous Freight CI/CD Deployment Automation Script
#
# This script automates all deployment steps:
# 1. Verify required GitHub secrets are set
# 2. Trigger CI workflow and wait for completion
# 3. Trigger and wait for Fly.io deployment workflow
# 4. Trigger and wait for Vercel deployment workflow
################################################################################

set -euo pipefail

REPO="${REPO:-Infaemous-Freight/Infamous-freight}"
CI_WORKFLOW="${CI_WORKFLOW:-ci.yml}"
FLY_WORKFLOW="${FLY_WORKFLOW:-fly-deploy.yml}"
VERCEL_WORKFLOW="${VERCEL_WORKFLOW:-vercel-deploy.yml}"
BRANCH="${BRANCH:-main}"
CI_TIMEOUT_SECONDS="${CI_TIMEOUT_SECONDS:-1200}"
DEPLOY_TIMEOUT_SECONDS="${DEPLOY_TIMEOUT_SECONDS:-900}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✅${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log_error "Required command not found: $cmd"
    exit 1
  fi
}

wait_for_workflow() {
  local workflow_file="$1"
  local max_wait="$2"
  local poll_interval=15
  local elapsed=0
  local wait_started_at
  local run_id=""

  wait_started_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  log_info "Polling $workflow_file status (timeout: ${max_wait}s)..."

  while [ "$elapsed" -lt "$max_wait" ]; do
    if [ -z "$run_id" ]; then
      local matching_run
      matching_run="$(gh run list \
        --repo "$REPO" \
        --workflow "$workflow_file" \
        --branch "$BRANCH" \
        --limit 20 \
        --json databaseId,createdAt,status,conclusion,url \
        --jq --arg wait_started_at "$wait_started_at" '[.[] | select(.createdAt >= $wait_started_at)][0]')"

      if [ -z "$matching_run" ] || [ "$matching_run" = "null" ]; then
        log_warning "Triggered workflow run not visible yet, retrying..."
        sleep "$poll_interval"
        elapsed=$((elapsed + poll_interval))
        continue
      fi

      run_id="$(echo "$matching_run" | jq -r '.databaseId')"
    fi

    local run_details status conclusion run_url
    run_details="$(gh run view "$run_id" --repo "$REPO" --json status,conclusion,url,databaseId)"
    status="$(echo "$run_details" | jq -r '.status')"
    conclusion="$(echo "$run_details" | jq -r '.conclusion')"
    run_url="$(echo "$run_details" | jq -r '.url')"

    if [ "$status" = "completed" ]; then
      if [ "$conclusion" = "success" ]; then
        log_success "$workflow_file completed successfully"
        log_info "Run URL: $run_url"
        return 0
      fi

      log_error "$workflow_file failed with conclusion: $conclusion"
      log_info "Run URL: $run_url"
      return 1
    fi

    echo -n "."
    sleep "$poll_interval"
    elapsed=$((elapsed + poll_interval))
  done

  echo ""
  log_error "$workflow_file did not complete within timeout"
  return 1
}

require_cmd gh
require_cmd jq

if ! gh auth status >/dev/null 2>&1; then
  log_error "GitHub CLI is not authenticated. Please run: gh auth login"
  exit 1
fi

REQUIRED_SECRETS=(
  "VITE_API_URL"
  "VITE_STRIPE_PUBLIC_KEY"
  "FLY_API_TOKEN"
  "VERCEL_TOKEN"
  "VERCEL_ORG_ID"
  "VERCEL_PROJECT_ID"
)

OPTIONAL_SECRETS=(
  "SENTRY_AUTH_TOKEN"
  "SENTRY_ORG"
  "SENTRY_PROJECT"
)

log_info "Checking required secrets in $REPO"
secrets_output="$(gh secret list --repo "$REPO")"
missing=()
for secret in "${REQUIRED_SECRETS[@]}"; do
  if grep -q "^$secret" <<< "$secrets_output"; then
    log_success "$secret is set"
  else
    missing+=("$secret")
    log_error "$secret is missing"
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  log_error "Missing ${#missing[@]} required secrets"
  exit 1
fi

for secret in "${OPTIONAL_SECRETS[@]}"; do
  if grep -q "^$secret" <<< "$secrets_output"; then
    log_info "Optional secret present: $secret"
  else
    log_warning "Optional secret missing: $secret"
  fi
done

log_info "Triggering CI workflow: $CI_WORKFLOW on $BRANCH"
gh workflow run "$CI_WORKFLOW" --repo "$REPO" --ref "$BRANCH"
sleep 20
wait_for_workflow "$CI_WORKFLOW" "$CI_TIMEOUT_SECONDS"

log_info "Triggering Fly deploy workflow: $FLY_WORKFLOW"
gh workflow run "$FLY_WORKFLOW" --repo "$REPO" --ref "$BRANCH"
sleep 10
wait_for_workflow "$FLY_WORKFLOW" "$DEPLOY_TIMEOUT_SECONDS"

log_info "Triggering Vercel deploy workflow: $VERCEL_WORKFLOW"
gh workflow run "$VERCEL_WORKFLOW" --repo "$REPO" --ref "$BRANCH"
sleep 10
wait_for_workflow "$VERCEL_WORKFLOW" "$DEPLOY_TIMEOUT_SECONDS"

log_success "CI and deployment workflows completed successfully"
log_info "CI: https://github.com/$REPO/actions/workflows/$CI_WORKFLOW"
log_info "Fly: https://github.com/$REPO/actions/workflows/$FLY_WORKFLOW"
log_info "Vercel: https://github.com/$REPO/actions/workflows/$VERCEL_WORKFLOW"
