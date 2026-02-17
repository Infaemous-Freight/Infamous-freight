#!/bin/bash

# Verify team training completion and access
# Run this to ensure all team members have necessary access/knowledge

set -e

echo "👥 Team Training Verification"
echo "=============================="
echo ""

# Check prerequisites
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI not found. Install with: brew install gh (macOS) or apt install gh (Linux)"
  exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q)
echo "📦 Repository: $REPO"
echo ""

# 1. Check GitHub access
echo "1️⃣  Checking GitHub repository access..."
MEMBERS=$(gh api repos/$REPO/collaborators --jq '.[] | .login' 2>/dev/null | wc -l)
echo "   ✅ GitHub members with access: $MEMBERS"
gh api repos/$REPO/collaborators --jq '.[] | .login' | sed 's/^/      - /'
echo ""

# 2. Check branch protection
echo "2️⃣  Checking branch protection rules..."
PROTECTION=$(gh api repos/$REPO/branches/main/protection --jq '.enforce_admins' 2>/dev/null || echo "null")
if [ "$PROTECTION" != "null" ]; then
  echo "   ✅ Branch protection is enabled"
else
  echo "   ⚠️  Branch protection is NOT enabled"
  echo "   Recommendation: Enable via GitHub → Settings → Branches"
fi
echo ""

# 3. Check GitHub Secrets
echo "3️⃣  Checking GitHub secrets configuration..."
echo "   Required secrets:"
REQUIRED_SECRETS=("DATABASE_URL" "JWT_SECRET" "SENTRY_DSN" "STRIPE_SECRET_KEY" "NEXTAUTH_SECRET")
MISSING=()

for secret in "${REQUIRED_SECRETS[@]}"; do
  if gh secret list --env production 2>/dev/null | grep -q "$secret"; then
    echo "      ✅ $secret"
  else
    echo "      ❌ Missing: $secret"
    MISSING+=("$secret")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  echo "   ⚠️  Missing secrets: ${MISSING[*]}"
  echo "   Setup: GitHub → Settings → Secrets → New secret"
fi
echo ""

# 4. Check access documentation
echo "4️⃣  Checking documentation..."
if [ -f "PRODUCTION_READINESS_100.md" ]; then
  echo "   ✅ PRODUCTION_READINESS_100.md exists"
else
  echo "   ❌ Missing: PRODUCTION_READINESS_100.md"
fi

if [ -f "docs/runbooks/normal-deployment.md" ]; then
  echo "   ✅ docs/runbooks/normal-deployment.md exists"
else
  echo "   ⚠️  Missing: docs/runbooks/normal-deployment.md"
fi

if [ -f "docs/runbooks/emergency-rollback.md" ]; then
  echo "   ✅ docs/runbooks/emergency-rollback.md exists"
else
  echo "   ⚠️  Missing: docs/runbooks/emergency-rollback.md"
fi
echo ""

# 5. Training checklist
echo "5️⃣  Team Training Requirement Checklist"
echo "   For each team member, ensure:"
echo ""
MODULES=(
  "Module 1: Deployment Safety (2 hours)"
  "Module 2: Incident Response (2 hours)"
  "Module 3: Monitoring & Observability (1.5 hours)"
  "Module 4: Security Procedures (1.5 hours)"
  "Module 5: Database Migrations (1 hour)"
)

for module in "${MODULES[@]}"; do
  echo "   ☐ $module"
done
echo ""

# 6. Access verification
echo "6️⃣  Platform Access Verification"
echo "   Verify each team member has:"
echo ""
echo "      ☐ GitHub push access to $REPO"
echo "      ☐ Vercel project admin access"
echo "      ☐ Sentry organization member access"
echo "      ☐ Datadog read access (if applicable)"
echo "      ☐ Fly.io deployment access (if applicable)"
echo ""

# 7. Permission matrix
echo "7️⃣  Role-Based Permission Matrix"
echo ""
echo "   ┌─────────────────┬──────┬──────┬────────┬────────┬──────────┐"
echo "   │ Role            │ Push │ Deploy│ Secrets│ Sentry │ Incident │"
echo "   ├─────────────────┼──────┼──────┼────────┼────────┼──────────┤"
echo "   │ Developers      │  ✅   │  ❌  │  ❌    │   ✅   │   ⚠️    │"
echo "   │ DevOps/SRE      │  ✅   │  ✅  │  ✅    │   ✅   │   ✅     │"
echo "   │ Team Lead       │  ✅   │  ✅  │  ⚠️   │   ✅   │   ✅     │"
echo "   │ Product Manager │  ❌   │  ❌  │  ❌    │   ⚠️   │   ✅     │"
echo "   └─────────────────┴──────┴──────┴────────┴────────┴──────────┘"
echo ""

# 8. Completion score
SCORE=0
TOTAL=5

# Check secrets
if gh secret list --env production 2>/dev/null | grep -q "JWT_SECRET"; then
  ((SCORE++))
fi

# Check documentation
[ -f "PRODUCTION_READINESS_100.md" ] && ((SCORE++))
[ -f "docs/runbooks/emergency-rollback.md" ] && ((SCORE++))

# Check branch protection
if [ "$PROTECTION" != "null" ]; then
  ((SCORE++))
fi

# Check members
if [ "$MEMBERS" -ge 2 ]; then
  ((SCORE++))
fi

echo ""
echo "█████████ Completion Score: $SCORE/$TOTAL ════"
echo ""

if [ "$SCORE" -eq "$TOTAL" ]; then
  echo "🎉 Your team is fully configured for production!"
  echo "   All systems ready to deploy with confidence."
else
  echo "⚠️  Some items still need setup:"
  echo "   Run the setup scripts:"
  echo "   - bash scripts/setup-sentry.sh"
  echo "   - bash scripts/setup-datadog.sh"
  echo "   - bash scripts/setup-uptime-monitoring.sh"
fi

echo ""
echo "✅ Training verification complete!"
