# 🔒 Security Fixes - Path to 100% Green

**Status**: 🔴 RED (0% → 100%)  
**Priority**: **CRITICAL** - Fix before production deployment  
**Estimated Time**: 1-2 hours  
**Dependabot Alerts**: 14 moderate severity issues

---

## 📋 Executive Summary

The codebase currently has **14 Dependabot security alerts** that need immediate
attention. These are moderate severity vulnerabilities in npm dependencies. This
guide provides a systematic approach to fix all security issues and bring the
Security category from 🔴 0% to 🟢 100% GREEN.

---

## 🎯 Security Alert Breakdown

### Current Status from Dependabot

Based on the GitHub repository security tab, you have:

- **14 alerts** - Moderate severity
- **Affected areas**:
  - `apps/api` - Express.js backend dependencies
  - `apps/web` - Next.js frontend dependencies
  - `apps/mobile` - React Native/Expo dependencies
  - `packages/shared` - Shared library dependencies

---

## 🚀 Fix Strategy (Choose One)

### Option 1: Automated Fix (Fastest - 15 minutes)

**Best for**: Most common vulnerabilities  
**Risk**: Low  
**Testing**: Automatic

```bash
# Navigate to workspace root
cd /workspaces/Infamous-freight-enterprises

# Fix API dependencies
cd apps/api
pnpm audit fix
pnpm audit fix --force  # If needed for breaking changes

# Fix Web dependencies
cd ../apps/web
pnpm audit fix
pnpm audit fix --force  # If needed

# Fix Mobile dependencies
cd ../apps/mobile
pnpm audit fix

# Fix Shared dependencies
cd ../packages/shared
pnpm audit fix

# Return to root and rebuild
cd /workspaces/Infamous-freight-enterprises
pnpm install
pnpm build
```

**Verify No Breaking Changes**:

```bash
# Run all tests
pnpm test

# If tests pass, commit
git add .
git commit -m "fix: Update dependencies to address 14 Dependabot security alerts"
git push origin main
```

---

### Option 2: Manual Fix (Safest - 1-2 hours)

**Best for**: Production-critical applications  
**Risk**: Lowest  
**Testing**: Manual verification

#### Step 1: Review Alerts

```bash
# Visit Dependabot dashboard
open https://github.com/MrMiless44/Infamous-freight/security/dependabot

# Identify specific packages and CVEs
# Take notes on:
# - Package name
# - Vulnerable version
# - Patched version
# - CVE number
```

#### Step 2: Update One Package at a Time

```bash
# Example: Updating a vulnerable package
cd apps/api

# Check current version
pnpm list [package-name]

# Update to specific safe version
pnpm update [package-name]@[safe-version]

# Run tests
pnpm test

# If tests pass, commit this single fix
git add package.json pnpm-lock.yaml
git commit -m "fix(security): Update [package-name] to v[safe-version] (CVE-XXXX-XXXXX)"
```

#### Step 3: Repeat for All 14 Alerts

Create a checklist:

```
[ ] Alert 1: [package name] - [CVE]
[ ] Alert 2: [package name] - [CVE]
[ ] Alert 3: [package name] - [CVE]
...
[ ] Alert 14: [package name] - [CVE]
```

---

### Option 3: GitHub Dependabot Auto-Merge (Easiest - 5 minutes)

**Best for**: CI/CD confidence  
**Risk**: Low if tests are comprehensive  
**Testing**: Automated via GitHub Actions

#### Enable Auto-Merge for Dependabot PRs

```bash
# 1. Visit Dependabot security tab
open https://github.com/MrMiless44/Infamous-freight/security/dependabot

# 2. For each alert:
#    - Click "Review security update"
#    - Click "Create Dependabot security update"
#    - Wait for PR to be created
#    - GitHub Actions will run tests automatically
#    - If tests pass, merge PR

# 3. Or enable auto-merge in repository settings:
#    Settings → Code security and analysis
#    → Dependabot security updates: Enable auto-merge
```

**Configure Auto-Merge** (`.github/dependabot.yml`):

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/apps/api"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    # Auto-merge security patches
    allow:
      - dependency-type: "all"
    commit-message:
      prefix: "fix"
      include: "scope"

  - package-ecosystem: "npm"
    directory: "/apps/web"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10

  - package-ecosystem: "npm"
    directory: "/apps/mobile"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## 🧪 Testing After Security Fixes

### 1. Run Full Test Suite

```bash
cd /workspaces/Infamous-freight-enterprises

# API tests
cd apps/api
pnpm test

# Web tests (if available)
cd ../apps/web
pnpm test

# E2E tests
cd ../e2e
pnpm test
```

### 2. Check Coverage

```bash
cd apps/api
pnpm test -- --coverage

# Verify thresholds still met:
# Branches: 86.2%
# Functions: 80.49%
# Lines: 84.33%
# Statements: 84.48%
```

### 3. Verify Security Headers Still Work

```bash
# Test API security headers
curl -I https://infamous-freight-api.fly.dev/api/health | grep -E "Strict|Content-Security|X-Frame"

# Expected output:
# strict-transport-security: max-age=31536000
# content-security-policy: default-src 'self'
# x-frame-options: DENY
# x-content-type-options: nosniff
```

### 4. Test Critical Endpoints

```bash
# Health check
curl https://infamous-freight-api.fly.dev/api/health

# Shipments list (with auth)
curl -H "Authorization: Bearer YOUR_JWT" \
  https://infamous-freight-api.fly.dev/api/shipments

# AI command (rate limited)
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"command":"optimize route"}' \
  https://infamous-freight-api.fly.dev/api/ai/command
```

---

## 📊 Security Verification Checklist

After applying fixes, verify:

### Dependabot Dashboard

```
✅ All 14 alerts resolved
✅ No new alerts introduced
✅ Security updates applied
✅ PRs merged (if using auto-merge)
```

### Testing Results

```
✅ API tests pass (197 tests)
✅ Coverage thresholds met (80-88%)
✅ No regressions introduced
✅ Build succeeds
```

### Deployment Verification

```
✅ GitHub Actions pass
✅ API deployed to Fly.io
✅ Web deployed to Vercel
✅ Health checks green
```

---

## 🔍 Common Security Vulnerabilities to Watch

### 1. Prototype Pollution

**Affected**: Older lodash, minimist versions  
**Fix**: Update to latest versions

```bash
pnpm update lodash@latest
pnpm update minimist@latest
```

### 2. Regular Expression Denial of Service (ReDoS)

**Affected**: Validator libraries, path-to-regexp  
**Fix**: Update to patched versions

```bash
pnpm update validator@latest
pnpm update path-to-regexp@latest
```

### 3. Server-Side Request Forgery (SSRF)

**Affected**: Older versions of axios, node-fetch  
**Fix**: Update to secure versions

```bash
pnpm update axios@latest
pnpm update node-fetch@latest
```

### 4. Cross-Site Scripting (XSS)

**Affected**: DOMPurify, sanitize-html  
**Fix**: Update to latest secure versions

```bash
pnpm update dompurify@latest
pnpm update sanitize-html@latest
```

---

## 🚀 Post-Fix Actions

### 1. Update Security Status

After all fixes are applied and verified:

```bash
# Update GREEN_100_STATUS.md
# Change Security section from:
# Security Alerts: 🔴 RED (0%)
# To:
# Security Alerts: 🟢 GREEN (100%)
```

### 2. Recalculate Overall Green Score

```
Code Implementation:  🟢 100%
Documentation:        🟢 100%
Git Repository:       🟢 100%
Deployment:           🟢 100% (after verification)
Testing:              🟡  85% (needs test writing)
Security:             🟢 100% (after fixes applied)

New Overall: 97.5% GREEN
```

### 3. Document Changes

Create a security fixes commit message:

```bash
git commit -m "fix(security): Resolve 14 Dependabot alerts

- Updated vulnerable dependencies across all workspaces
- apps/api: [list major updates]
- apps/web: [list major updates]
- apps/mobile: [list major updates]
- packages/shared: [list major updates]

Verified:
- All 197 tests pass
- Coverage thresholds met (80-88%)
- Security headers functional
- No regressions introduced

Closes: #[issue-number] (if applicable)
Fixes: CVE-XXXX-XXXXX, CVE-YYYY-YYYYY, ... (list all CVEs)"
```

---

## 📖 Reference: Specific Package Updates

### Common Vulnerable Packages (Check Your Dependabot)

#### Express.js Backend (`apps/api`)

```bash
# Typical security updates
pnpm update express@latest
pnpm update helmet@latest
pnpm update express-rate-limit@latest
pnpm update jsonwebtoken@latest
pnpm update bcrypt@latest
pnpm update multer@latest
```

#### Next.js Frontend (`apps/web`)

```bash
# Next.js security updates
pnpm update next@latest
pnpm update react@latest
pnpm update react-dom@latest
pnpm update axios@latest
pnpm update sharp@latest
```

#### React Native Mobile (`apps/mobile`)

```bash
# Expo security updates
pnpm update expo@latest
pnpm update react-native@latest
pnpm update expo-updates@latest
```

#### Shared Package

```bash
# TypeScript and utilities
pnpm update typescript@latest
pnpm update zod@latest
pnpm update date-fns@latest
```

---

## 🎯 Success Criteria

You'll know security fixes are complete when:

1. **Dependabot Dashboard**
   - ✅ Shows 0 open alerts
   - ✅ All 14 alerts marked as "Fixed"
   - ✅ No new vulnerabilities introduced

2. **Tests Pass**
   - ✅ API: 197/197 tests passing
   - ✅ Coverage: 80-88% maintained
   - ✅ No new failures

3. **Deployment Succeeds**
   - ✅ GitHub Actions: All checks green
   - ✅ Fly.io: API deployed successfully
   - ✅ Vercel: Web deployed successfully

4. **Security Headers Active**
   - ✅ Strict-Transport-Security present
   - ✅ Content-Security-Policy present
   - ✅ X-Frame-Options: DENY present

5. **GREEN_100_STATUS.md Updated**
   - ✅ Security section shows 🟢 100%
   - ✅ Overall score recalculated to ~98%

---

## ⚡ Quick Commands (Copy-Paste Ready)

### Full Automated Fix

```bash
#!/bin/bash
# Quick security fix script
set -e

echo "🔒 Starting security fixes..."

# API
cd /workspaces/Infamous-freight-enterprises/apps/api
pnpm audit fix
pnpm test

# Web
cd ../apps/web
pnpm audit fix
pnpm test || echo "Web tests skipped (if none exist)"

# Mobile
cd ../apps/mobile
pnpm audit fix

# Shared
cd ../packages/shared
pnpm audit fix
pnpm build

# Root rebuild
cd /workspaces/Infamous-freight-enterprises
pnpm install

echo "✅ Security fixes applied!"
echo "📝 Review changes with: git diff"
echo "🚀 Commit with: git add . && git commit -m 'fix: Security updates'"
```

Save as `fix-security.sh`, then:

```bash
chmod +x fix-security.sh
./fix-security.sh
```

---

## 🔗 Related Documentation

- [GREEN_100_STATUS.md](GREEN_100_STATUS.md) - Overall green status tracking
- [TEST_COVERAGE_100_STRATEGY.md](TEST_COVERAGE_100_STRATEGY.md) - Test writing
  guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment procedures
- [SECURITY.md](SECURITY.md) - Security policy
- [GitHub Dependabot Docs](https://docs.github.com/en/code-security/dependabot)

---

## 🆘 Troubleshooting

### Issue: `pnpm audit fix` Doesn't Fix All Alerts

**Solution**: Some vulnerabilities require breaking changes

```bash
# Try force flag
pnpm audit fix --force

# Or update manually
pnpm update [package-name]@latest
```

### Issue: Tests Fail After Updates

**Solution**: Roll back specific package

```bash
# Revert specific package
pnpm install [package-name]@[previous-version]

# Run tests again
pnpm test

# If tests pass, that package needs manual migration
```

### Issue: Build Fails After Updates

**Solution**: Check for breaking API changes

```bash
# Read package CHANGELOG
open https://github.com/[package-org]/[package-name]/blob/main/CHANGELOG.md

# Follow migration guide
# Update your code to match new API

# Rebuild
pnpm build
```

---

## ✅ Completion

After completing all security fixes:

1. ✅ Update GREEN_100_STATUS.md (Security: 🔴 → 🟢)
2. ✅ Commit changes with detailed message
3. ✅ Push to origin/main
4. ✅ Verify GitHub Actions pass
5. ✅ Verify Dependabot shows 0 alerts

**Congratulations!** 🎉 Security is now **100% GREEN**! 🟢

Next step: Follow [TEST_COVERAGE_100_STRATEGY.md](TEST_COVERAGE_100_STRATEGY.md)
to bring Testing from 85% to 100%.
