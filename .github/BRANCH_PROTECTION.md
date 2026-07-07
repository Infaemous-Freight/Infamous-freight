# GitHub Branch Protection Configuration
# 
# This file documents the recommended branch protection rules for the `main` branch.
# Configure these in Settings → Branches → Branch protection rules
#
# Why these settings?
# - Code quality gates: Prevents broken code from being merged
# - Deployment approval: Manual gating before production
# - Audit trail: GitHub tracks all deployments and reviews
# - Team accountability: Requires human review before merge

# ============================================================================
# REQUIRED STATUS CHECKS
# ============================================================================
# These workflows must pass before PRs can be merged.
# Configure in: Settings → Branches → main → Require status checks to pass

Status Checks (Required):
  - Lint & Typecheck / Lint & Typecheck API
    Reason: Catches TypeScript errors, unused code, implicit types
    
  - Lint & Typecheck / Lint & Typecheck Web
    Reason: Ensures web bundle compiles with strict mode
    
  - CodeQL Analysis (if enabled)
    Reason: Detects security vulnerabilities and code smells
    
  - Secret Scan (if enabled)
    Reason: Prevents accidental credential commits

# ============================================================================
# REQUIRED REVIEWS & PROTECTIONS
# ============================================================================
# Configure in: Settings → Branches → main → Protect matching branches

Review Requirements:
  - Require pull request reviews before merging: ✅ 1 approval
    Reason: At least one human review of code changes
    
  - Dismiss stale pull request approvals when new commits are pushed: ✅ Yes
    Reason: Ensures reviews are current with latest changes
    
  - Require review from Code Owners: ⚠️ If CODEOWNERS file exists
    Reason: Domain experts review their areas

Deployment Requirements:
  - Require deployments to succeed before merging: ✅ Yes
    Reason: Production environment must approve deployment
    
  - Required deployment environments: production
    Reason: Links deploy workflow to branch protection
    
  - Dismiss stale deployment reviews: ✅ Yes
    Reason: Redeploy doesn't need old approvals

Branch Requirements:
  - Require branches to be up to date before merging: ✅ Yes
    Reason: Prevents merge conflicts, ensures tests run with latest main
    
  - Restrict who can push to matching branches: ⚠️ Admins only (optional)
    Reason: Prevents accidental direct commits to main

# ============================================================================
# OPTIONAL BUT RECOMMENDED
# ============================================================================

Enforcement:
  - Enforce all above settings for administrators: ✅ No
    Note: Admins can override for emergency hotfixes. Document in PR.
    
  - Allow force pushes: ✅ No
    Reason: Rewriting history breaks audit trail
    
  - Allow deletions: ✅ No
    Reason: Prevents accidental branch deletion

# ============================================================================
# SETUP INSTRUCTIONS
# ============================================================================
#
# 1. Go to: https://github.com/Infaemous-Freight/Infamous-freight/settings/branches
#
# 2. Click "Add rule"
#
# 3. Branch name pattern: main
#
# 4. Under "Protect matching branches":
#    ☑️ Require a pull request before merging
#       - Require 1 approval
#       ☑️ Dismiss stale pull request approvals
#       
#    ☑️ Require status checks to pass before merging
#       - Require branches to be up to date before merging
#       - Search for and select:
#         • "Lint & Typecheck / Lint & Typecheck API"
#         • "Lint & Typecheck / Lint & Typecheck Web"
#         • "CodeQL Analysis" (if using)
#       
#    ☑️ Require deployments to succeed before merging
#       - Required deployment environments: production
#       ☑️ Dismiss stale deployment reviews
#       
#    ☑️ Require a conversation resolution before merging
#
# 5. Click "Create"
#
# ============================================================================
# GITHUB CLI (ALTERNATIVE SETUP)
# ============================================================================
#
# If you prefer CLI setup:
#
# gh api repos/Infaemous-Freight/Infamous-freight/branches/main/protection \
#   -X PUT \
#   -f required_status_checks.strict=true \
#   -f required_status_checks.contexts='["Lint & Typecheck / Lint & Typecheck API","Lint & Typecheck / Lint & Typecheck Web"]' \
#   -f required_pull_request_reviews.required_approving_review_count=1 \
#   -f required_pull_request_reviews.dismiss_stale_reviews=true \
#   -f enforce_admins=false \
#   -f allow_force_pushes=false \
#   -f allow_deletions=false
#
# ============================================================================
# VERIFYING YOUR SETUP
# ============================================================================
#
# Check current protection settings:
#
# gh api repos/Infaemous-Freight/Infamous-freight/branches/main/protection
#
# This will output the current protection rules as JSON.
#
# ============================================================================
