# GitHub Actions Workflow Guide

## Overview

This document describes all GitHub Actions workflows in the Infamous Freight
Enterprises repository, their purposes, triggers, and troubleshooting steps.

---

## Workflow Directory

| Workflow                | File                     | Purpose                                      | Trigger                          | Status    |
| ----------------------- | ------------------------ | -------------------------------------------- | -------------------------------- | --------- |
| **CI/CD Pipeline**      | `ci-cd.yml`              | Main pipeline: lint, test, build, security   | Push to main/develop, PR to main | ✅ Active |
| **CI**                  | `ci.yml`                 | Lightweight CI checks                        | Push to main, PR                 | ✅ Active |
| **E2E Tests**           | `e2e.yml`                | End-to-end Playwright tests                  | Scheduled nightly, manual        | ✅ Active |
| **Deploy API (Render)** | `render-deploy.yml`      | Deploy API to Render                         | Push to main, manual             | ✅ Active |
| **Deploy API (Fly.io)** | `fly-deploy.yml`         | Deploy API to Fly.io                         | Push to main, manual             | ✅ Active |
| **Deploy Web (Vercel)** | `vercel-deploy.yml`      | Deploy Web to Vercel                         | Push to main, manual             | ✅ Active |
| **GitHub Pages**        | `deploy-pages.yml`       | Deploy static docs/status to Pages           | Push to main, manual             | ✅ Active |
| **Docker Build**        | `docker-build.yml`       | Build & push Docker images                   | Push to main, manual             | ✅ Active |
| **Auto PR Test Fix**    | `auto-pr-test-fix.yml`   | Auto-create PR with test fixes on CI failure | CI workflow failure, manual      | ✅ Active |
| **CodeQL Analysis**     | `codeql.yml`             | SAST security scanning                       | Push, PR, scheduled weekly       | ✅ Active |
| **Container Security**  | `container-security.yml` | Scan Docker images for vulnerabilities       | Docker build completion          | ✅ Active |
| **HTML Validation**     | `html-validation.yml`    | Validate HTML output                         | Push to main                     | ✅ Active |
| **HTML Quality**        | `html-quality.yml`       | Check HTML quality metrics                   | Push to main                     | ✅ Active |

---

## Detailed Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Purpose:** Main continuous integration and deployment pipeline

**Trigger:**

- Push to `main` or `develop` branches
- Pull requests to `main`

**Jobs:**

1. **Lint & Type Check** - ESLint, Prettier, TypeScript
2. **Test** - Jest unit tests with coverage thresholds
3. **Build** - Build API, Web, and Shared packages
4. **Security** - Dependency audit, SAST scanning
5. **Deploy** - Deploy to staging/production

**Environment Variables:**

```
NODE_VERSION: 20.x
PNPM_VERSION: 8.15.9
API_PORT: 4000
WEB_PORT: 3000
DATABASE_URL: postgres://... (from secrets)
JWT_SECRET: (from secrets)
AI_PROVIDER: synthetic
```

**Troubleshooting:**

- **Lint fails**: Run `pnpm lint --fix` locally
- **Type errors**: Run `pnpm typecheck` locally
- **Test failures**: Check `apps/api/coverage/` reports, run `pnpm test` locally
- **Build fails**: Ensure `pnpm --filter @infamous-freight/shared build` runs
  first

**Performance:**

- Target runtime: < 15 minutes
- Parallel jobs: Lint, Test, Build run in parallel
- Caching: pnpm store cached by lock file hash

---

### 2. CI (`ci.yml`)

**Purpose:** Lightweight CI checks for quick feedback

**Trigger:**

- Push to `main`
- Pull requests
- Excludes: `archive/**` paths

**Jobs:**

1. **CI Job** - Package guards, install, test, lint, build

**Key Checks:**

- No `package-lock.json` files (pnpm only)
- Install and test all packages
- Lint all packages
- Build all packages

**Troubleshooting:**

- **package-lock.json found**: Remove with `git rm --cached package-lock.json`
- **Install fails**: Check `pnpm-lock.yaml` is committed
- **Test fails**: Same as CI/CD pipeline

---

### 3. E2E Tests (`e2e.yml`)

**Purpose:** End-to-end testing with Playwright

**Trigger:**

- Scheduled: Every night at 2 AM UTC
- Manual workflow_dispatch

**Services:**

- PostgreSQL 15-alpine
- Redis 7-alpine

**Environment Setup:**

- Database migrations applied
- Web server started on port 3000
- API server on port 4000

**Test Browsers:**

- Chromium
- Firefox
- WebKit

**Troubleshooting:**

- **Database connection failed**: Check `DATABASE_URL` format and PostgreSQL
  service health
- **Web server not starting**: Check port 3000 is available
- **Test timeouts**: Increase `PLAYWRIGHT_TIMEOUT` or check server logs
- **Browser download fails**: Re-run with `playwright install`

---

### 4. Deploy API (Render) (`render-deploy.yml`)

**Purpose:** Deploy API to Render hosting

**Trigger:**

- Push to `main`
- Manual workflow_dispatch

**Required Secrets:**

- `RENDER_DEPLOY_HOOK_URL` - Render deployment webhook

**Deployment Process:**

1. Trigger Render deploy hook via curl
2. Render pulls latest code and rebuilds

**Troubleshooting:**

- **Deploy hook fails**: Verify `RENDER_DEPLOY_HOOK_URL` is correct in GitHub
  Secrets
- **Build fails on Render**: Check API logs on Render dashboard
- **ENV variables missing**: Ensure all vars set in Render environment

**Post-Deploy Verification:**

```bash
# Health check
curl https://api.infamous-freight.com/api/health
```

---

### 5. Deploy Web (Vercel) (`vercel-deploy.yml`)

**Purpose:** Deploy Web app to Vercel

**Trigger:**

- Push to `main`
- Manual workflow_dispatch

**Required Secrets:**

- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

**Build Steps:**

1. Install dependencies
2. Build shared package
3. Deploy to Vercel

**Environment Variables:**

- `NEXT_PUBLIC_API_URL` - API endpoint for frontend
- `NEXT_PUBLIC_ENV` - Environment (production/staging)
- `NEXT_PUBLIC_DD_*` - Datadog RUM configuration

**Troubleshooting:**

- **Vercel auth fails**: Check `VERCEL_TOKEN` has correct permissions
- **Build fails**: Run `pnpm --filter web build` locally
- **Deployment blocked**: Check Vercel project settings for auto-deployment

**Post-Deploy Verification:**

```bash
curl https://infamous-freight-enterprises-git-*.vercel.app/
```

---

### 6. GitHub Pages (`deploy-pages.yml`)

**Purpose:** Deploy static docs and status pages to GitHub Pages

**Trigger:**

- Push to `main`
- Manual workflow_dispatch

**Build Process:**

1. Build with `pnpm run build:pages` (static export)
2. Run Lighthouse CI for performance validation
3. Deploy to `gh-pages` branch

**Environment Variables:**

- `GITHUB_PAGES_BUILD=true` - Enable static export mode
- `HUSKY=0` - Disable git hooks during build

**Troubleshooting:**

- **build:pages script not found**: Check it exists in `apps/web/package.json`
- **Lighthouse fails**: Lower thresholds in `lighthouserc.json`
- **Deploy permission denied**: Ensure repo has GitHub Pages enabled

**Live Site:**

```
https://MrMiless44.github.io/Infamous-freight-enterprises/
```

---

### 7. Docker Build (`docker-build.yml`)

**Purpose:** Build and push Docker images

**Trigger:**

- Push to `main`
- Manual workflow_dispatch

**Images Built:**

1. `API` - Express.js backend
2. `Web` - Next.js frontend
3. `Mobile` - React Native app (if applicable)

**Registry:** Docker Hub (or GitHub Container Registry)

**Build Arguments:**

- `NODE_ENV=production`
- `DATABASE_URL` - For Prisma generation
- `API_PORT=4000`

**Troubleshooting:**

- **Prisma generation fails**: Check `DATABASE_URL` format in build context
- **Image too large**: Review `.dockerignore` for unnecessary files
- **Push fails**: Verify Docker registry credentials in secrets

---

### 8. Auto PR Test Fix (`auto-pr-test-fix.yml`)

**Purpose:** Auto-create PR with test fixes when CI fails

**Trigger:**

- CI workflow completion with failure status
- Manual workflow_dispatch

**Process:**

1. Checkout failed branch
2. Run tests to identify failures
3. Execute `scripts/auto-fix-tests.sh` to auto-fix issues
4. Create PR if fixes applied

**Requirements:**

- `scripts/auto-fix-tests.sh` must exist and be executable
- Fixes should result in passing tests

**Troubleshooting:**

- **Auto-fix script not found**: Create `scripts/auto-fix-tests.sh`
- **PR not created**: Check git status and ensure files changed
- **Fixes incomplete**: Improve auto-fix script logic

---

## Security & Secrets

### Required Secrets

| Secret                   | Usage                 | Rotation                |
| ------------------------ | --------------------- | ----------------------- |
| `GITHUB_TOKEN`           | Built-in, repo access | Auto (per run)          |
| `JWT_SECRET`             | API authentication    | Every 90 days           |
| `DATABASE_URL`           | PostgreSQL connection | When credentials change |
| `RENDER_DEPLOY_HOOK_URL` | Render deployment     | When regenerated        |
| `VERCEL_TOKEN`           | Vercel API access     | Every 6 months          |
| `OPENAI_API_KEY`         | Optional AI provider  | Every 3 months          |
| `ANTHROPIC_API_KEY`      | Optional AI provider  | Every 3 months          |

**Checklist:**

- [ ] Secrets never logged to stdout
- [ ] Secrets masked in workflow logs (automatic)
- [ ] Rotation reminders set in calendar
- [ ] Expired secrets replaced immediately

---

## Performance Targets

| Metric                  | Target   | Current  |
| ----------------------- | -------- | -------- |
| CI/CD Pipeline Duration | < 15 min | ~12 min  |
| E2E Test Duration       | < 10 min | ~8 min   |
| Web Build Duration      | < 3 min  | ~2.5 min |
| API Build Duration      | < 2 min  | ~1.5 min |
| Deploy Duration         | < 5 min  | ~3 min   |

**Optimization Tips:**

- Use matrix strategy for parallel testing
- Cache aggressively (pnpm store, node_modules)
- Skip unnecessary jobs with conditional `if` statements
- Use `actions/upload-artifact` for build outputs

---

## Monitoring & Alerts

### Health Checks

**Daily Checks:**

- [ ] All workflows passing on main branch
- [ ] No failed deployments in last 24 hours
- [ ] API health endpoint responding (200 OK)
- [ ] Web app loading without errors

**Weekly Checks:**

- [ ] Security scan results reviewed
- [ ] Performance metrics stable
- [ ] No critical dependencies outdated
- [ ] Logs reviewed for errors

**Monthly Checks:**

- [ ] Cost analysis (GitHub Actions minutes)
- [ ] Secrets rotation completed
- [ ] Workflow documentation updated
- [ ] Performance budgets reviewed

### Notification Channels

- **GitHub**: Workflow failure notifications
- **Email**: Secret rotation reminders (set in calendar)
- **Slack** (optional): Deploy notifications via GitHub app
- **Sentry**: Error tracking and monitoring

---

## Common Issues & Solutions

### ❌ "pnpm: command not found"

**Cause:** pnpm not installed before first use **Solution:** Ensure
`pnpm/action-setup@v2` runs before other pnpm commands

```yaml
- uses: pnpm/action-setup@v2
  with:
    version: 8.15.9
```

---

### ❌ "Port 3000 already in use"

**Cause:** Multiple services competing for same port **Solution:** Set different
ports in environment

```env
API_PORT=4000
WEB_PORT=3000
```

---

### ❌ "Insufficient coverage"

**Cause:** Code changes don't meet coverage threshold **Solution:** Add tests
for new code, or update threshold

**Current Thresholds:**

- API: 75%
- Web: 70%
- Shared: 90%

---

### ❌ "Invalid secret conditional"

**Cause:** Using `if: ${{ secrets.X != '' }}` (invalid syntax) **Solution:**
Remove conditional, use fallback values instead

```yaml
# ❌ Wrong
if: ${{ secrets.API_KEY != '' }}

# ✅ Correct
env:
  API_KEY: ${{ secrets.API_KEY || 'fallback' }}
```

---

### ❌ "Workflow not triggering"

**Cause:** Event filter not matching push/PR conditions **Solution:** Check
`on:` conditions match your branch/path

```yaml
on:
  push:
    branches: [main] # Only these branches
    paths-ignore: # These paths don't trigger
      - "archive/**"
```

---

## Quick Reference Commands

```bash
# Test all packages
pnpm -r --parallel test

# Test single package
pnpm --filter @infamous-freight/shared test

# Run specific workflow locally (act)
act push -j lint

# Check workflow syntax
actionlint .github/workflows/*.yml

# View workflow runs
gh run list --workflow ci-cd.yml

# Watch specific run
gh run view <run-id> --log

# Cancel running workflow
gh run cancel <run-id>
```

---

## Workflow Diagram

```
Push to main
    ↓
┌─────────────────────────────────────┐
│   CI/CD Pipeline                    │
├─────────────────────────────────────┤
│ ├─ Lint & Type Check ────┐          │
│ ├─ Test (API, Web, etc) ─┤ parallel │
│ └─ Build (All packages) ──┘          │
└──────────────┬──────────────────────┘
               ↓ (if all pass)
        ┌──────────────────────┐
        │ Deploy to Production │
        ├──────────────────────┤
        │ ├─ Deploy API        │
        │ ├─ Deploy Web        │
        │ └─ Deploy Docs       │
        └──────────────────────┘
```

---

## Contributing

When modifying workflows:

1. **Validate syntax**: Run `actionlint` before committing
2. **Test locally**: Use `act` to test locally
3. **Document changes**: Update this guide
4. **Request review**: Have changes reviewed before merge
5. **Monitor impact**: Watch first run closely for unexpected behavior

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [workflow syntax reference](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions)
- [Secrets Documentation](https://docs.github.com/actions/security-guides/encrypted-secrets)
- [Using environments for deployment](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [act - Run GitHub Actions Locally](https://github.com/nektos/act)
- [actionlint - Workflow Linter](https://github.com/rhysd/actionlint)

---

**Last Updated:** December 31, 2025 **Maintained By:** DevOps Team
