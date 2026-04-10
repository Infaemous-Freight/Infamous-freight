#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Bootstrap production secrets for Netlify + Fly.io.

Required environment variables:
  NETLIFY_AUTH_TOKEN
  NETLIFY_SITE_ID
  FLY_API_TOKEN
  DATABASE_URL
  NEXT_PUBLIC_API_URL
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  JWT_SECRET

Optional environment variables:
  FLY_APP_NAME         (default: infamous-freight-api)
  NETLIFY_CONTEXT      (default: production)
  DRY_RUN              (set to 1 to print actions without applying)

Example:
  NETLIFY_AUTH_TOKEN=... NETLIFY_SITE_ID=... FLY_API_TOKEN=... \
  DATABASE_URL=... NEXT_PUBLIC_API_URL=https://infamous.fly.dev \
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... JWT_SECRET=$(openssl rand -base64 32) \
  ./scripts/bootstrap-production-secrets.sh
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "[bootstrap-secrets] Missing required env var: ${name}" >&2
    exit 1
  fi
}

for cmd in netlify flyctl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[bootstrap-secrets] Required command not found: $cmd" >&2
    exit 1
  fi
done

required_vars=(
  NETLIFY_AUTH_TOKEN
  NETLIFY_SITE_ID
  FLY_API_TOKEN
  DATABASE_URL
  NEXT_PUBLIC_API_URL
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  JWT_SECRET
)

for var_name in "${required_vars[@]}"; do
  require_var "$var_name"
done

if [[ ! "${NETLIFY_SITE_ID}" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; then
  echo "[bootstrap-secrets] NETLIFY_SITE_ID must be a UUID" >&2
  exit 1
fi

if [[ ! "${DATABASE_URL}" =~ ^postgres(ql)?:// ]]; then
  echo "[bootstrap-secrets] DATABASE_URL must start with postgres:// or postgresql://" >&2
  exit 1
fi

if [[ ! "${NEXT_PUBLIC_API_URL}" =~ ^https:// ]]; then
  echo "[bootstrap-secrets] NEXT_PUBLIC_API_URL must be https:// in production" >&2
  exit 1
fi

if [[ ! "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}" =~ ^pk_(live|test)_ ]]; then
  echo "[bootstrap-secrets] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a Stripe publishable key" >&2
  exit 1
fi

if [[ ! "${STRIPE_SECRET_KEY}" =~ ^sk_(live|test)_[[:alnum:]]+$ ]]; then
  echo "[bootstrap-secrets] STRIPE_SECRET_KEY must be a Stripe secret key" >&2
  exit 1
fi

if [[ ! "${STRIPE_WEBHOOK_SECRET}" =~ ^whsec_[^[:space:]]+$ ]]; then
  echo "[bootstrap-secrets] STRIPE_WEBHOOK_SECRET must be a Stripe webhook signing secret" >&2
  exit 1
fi

if [[ ${#JWT_SECRET} -lt 32 ]]; then
  echo "[bootstrap-secrets] JWT_SECRET must be at least 32 characters" >&2
  exit 1
fi

FLY_APP_NAME="${FLY_APP_NAME:-infamous-freight-api}"
NETLIFY_CONTEXT="${NETLIFY_CONTEXT:-production}"
DRY_RUN="${DRY_RUN:-0}"

echo "[bootstrap-secrets] Applying Netlify env vars to context '${NETLIFY_CONTEXT}' for site '***'."
if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] env NETLIFY_AUTH_TOKEN=*** netlify env:set NEXT_PUBLIC_API_URL \"\$NEXT_PUBLIC_API_URL\" --context ${NETLIFY_CONTEXT} --site ***"
  echo "[dry-run] env NETLIFY_AUTH_TOKEN=*** netlify env:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \"\$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\" --context ${NETLIFY_CONTEXT} --site ***"
  echo "[dry-run] env NETLIFY_AUTH_TOKEN=*** netlify env:set STRIPE_SECRET_KEY \"\$STRIPE_SECRET_KEY\" --context ${NETLIFY_CONTEXT} --site ***"
  echo "[dry-run] env NETLIFY_AUTH_TOKEN=*** netlify env:set STRIPE_WEBHOOK_SECRET \"\$STRIPE_WEBHOOK_SECRET\" --context ${NETLIFY_CONTEXT} --site ***"
  echo "[dry-run] env NETLIFY_AUTH_TOKEN=*** netlify env:set JWT_SECRET \"\$JWT_SECRET\" --context ${NETLIFY_CONTEXT} --site ***"
else
  env NETLIFY_AUTH_TOKEN="$NETLIFY_AUTH_TOKEN" \
    netlify env:set NEXT_PUBLIC_API_URL "$NEXT_PUBLIC_API_URL" --context "$NETLIFY_CONTEXT" --site "$NETLIFY_SITE_ID"
  env NETLIFY_AUTH_TOKEN="$NETLIFY_AUTH_TOKEN" \
    netlify env:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" --context "$NETLIFY_CONTEXT" --site "$NETLIFY_SITE_ID"
  env NETLIFY_AUTH_TOKEN="$NETLIFY_AUTH_TOKEN" \
    netlify env:set STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY" --context "$NETLIFY_CONTEXT" --site "$NETLIFY_SITE_ID"
  env NETLIFY_AUTH_TOKEN="$NETLIFY_AUTH_TOKEN" \
    netlify env:set STRIPE_WEBHOOK_SECRET "$STRIPE_WEBHOOK_SECRET" --context "$NETLIFY_CONTEXT" --site "$NETLIFY_SITE_ID"
  env NETLIFY_AUTH_TOKEN="$NETLIFY_AUTH_TOKEN" \
    netlify env:set JWT_SECRET "$JWT_SECRET" --context "$NETLIFY_CONTEXT" --site "$NETLIFY_SITE_ID"
fi

echo "[bootstrap-secrets] Applying Fly.io secrets to app '${FLY_APP_NAME}'."
if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] env FLY_API_TOKEN=*** flyctl secrets set DATABASE_URL=\"\$DATABASE_URL\" JWT_SECRET=\"\$JWT_SECRET\" STRIPE_SECRET_KEY=\"\$STRIPE_SECRET_KEY\" STRIPE_WEBHOOK_SECRET=\"\$STRIPE_WEBHOOK_SECRET\" --app ${FLY_APP_NAME}"
else
  env FLY_API_TOKEN="$FLY_API_TOKEN" flyctl secrets set \
    DATABASE_URL="$DATABASE_URL" \
    JWT_SECRET="$JWT_SECRET" \
    STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
    STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
    --app "$FLY_APP_NAME"
fi

echo "[bootstrap-secrets] Done. Verify with:"
echo "  NETLIFY_AUTH_TOKEN=*** netlify env:list --context ${NETLIFY_CONTEXT} --site ***"
echo "  FLY_API_TOKEN=*** flyctl secrets list --app ${FLY_APP_NAME}"
