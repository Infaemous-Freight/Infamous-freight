#!/usr/bin/env bash
set -euo pipefail

required_env=(
  "AI_PROVIDER"
)

# Provider-specific keys (e.g., OPENAI_API_KEY, ANTHROPIC_API_KEY) are validated
# at runtime based on AI_PROVIDER and are not universally required here.
required_services=(
  "api-gateway"
  "ai-core"
  "compliance-engine"
  "avatar-service"
  "audit-service"
  "realtime-service"
  "payments-service"
)

required_realtime_tables=(
  "ai_requests"
  "compliance_decisions"
  "audits"
)

status_ok() {
  echo "[OK] $1"
}

status_warn() {
  echo "[WARN] $1"
}

status_fail() {
  echo "[FAIL] $1"
}

echo "GENESIS go-live verification"
echo "==========================="

has_errors=0

echo
echo "1) Environment checks"
for var_name in "${required_env[@]}"; do
  if [[ -n "${!var_name:-}" ]]; then
    status_ok "$var_name is set"
  else
    status_fail "$var_name is not set"
    has_errors=1
  fi
done

echo
echo "2) Deployment config checks"
if [[ -f "supabase/config.toml" ]]; then
  status_ok "supabase/config.toml exists"
else
  status_warn "supabase/config.toml missing (run supabase init)"
fi

if [[ -d "services" ]]; then
  status_ok "services directory exists"
else
  status_fail "services directory missing"
  has_errors=1
fi

echo
echo "3) Runtime service registration"
for service in "${required_services[@]}"; do
  if rg -n "${service}" docker-compose*.yml railway.json render.yaml >/dev/null 2>&1; then
    status_ok "Found service reference: ${service}"
  else
    status_warn "Service reference not found in deploy manifests: ${service}"
  fi
done

echo
echo "4) Realtime table readiness"
for table in "${required_realtime_tables[@]}"; do
  if rg -n "${table}" supabase DATABASE_MIGRATIONS.sql >/dev/null 2>&1; then
    status_ok "Found table reference: ${table}"
  else
    status_warn "Missing table reference in supabase artifacts: ${table}"
  fi
done

echo
echo "5) Compliance / audit controls"
if rg -n "E-LAW|compliance" services packages src >/dev/null 2>&1; then
  status_ok "Compliance references found"
else
  status_warn "Compliance references not found in services/packages/src"
fi

if rg -n "audit" services packages src >/dev/null 2>&1; then
  status_ok "Audit references found"
else
  status_warn "Audit references not found in services/packages/src"
fi

echo
echo "Verification complete"
if [[ "$has_errors" -eq 0 ]]; then
  status_ok "Blocking checks passed"
  exit 0
fi

status_fail "Blocking checks failed"
exit 1
