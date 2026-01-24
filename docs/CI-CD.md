# CI/CD Documentation

Comprehensive guide to the Continuous Integration and Continuous Deployment workflows for Infamous Freight.

## 📋 Overview

The project uses GitHub Actions for CI/CD with the following workflows:
- **CI (Main)**: Linting, type checking, testing, and building
- **Security**: Dependency audits and secret scanning
- **CodeQL**: Advanced code analysis and vulnerability detection
- **E2E Tests**: End-to-end testing with Playwright
- **Deploy**: Automated deployment workflows

## 🔄 Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Trigger**: Push to `main`/`develop`, PRs to `main`/`develop`

**Jobs**:
1. **Validate** (5 min)
   - Check for `package-lock.json` (pnpm only)
   - Verify no committed `node_modules`
   
2. **Lint** (10 min)
   - ESLint with `--max-warnings=0`
   - Prettier format check
   - Runs on: API package
   
3. **Type Check** (10 min)
   - Build shared package
   - TypeScript compilation check
   - Runs on: All TypeScript packages
   
4. **Test** (15 min)
   - Jest unit/integration tests
   - Coverage report generation
   - Upload to Codecov
   - Threshold: 80-88% coverage
   
5. **Build** (20 min)
   - Build shared package
   - Build API package
   - Build web package (if configured)
   - Upload build artifacts

**Success Criteria**: All jobs must pass

**Environment Variables**:
- `NODE_VERSION`: 22.16.0
- `PNPM_VERSION`: 9.15.0

### 2. Security Workflow (`.github/workflows/security.yml`)

**Trigger**: 
- Push to `main`/`develop` (code changes)
- PR to `main`/`develop`
- Weekly schedule (Sunday 2 AM UTC)
- Manual trigger

**Jobs**:
1. **Dependency Audit**
   - `pnpm audit --audit-level=high`
   - Checks for known vulnerabilities
   - Fails on high/critical issues
   
2. **Secret Scan**
   - TruffleHog OSS for secret detection
   - Pattern matching for API keys, tokens, passwords
   - Verifies `.env` files not committed
   
3. **Security Summary**
   - Reports overall security status
   - Aggregates results from all checks

**Permissions**: Minimal (read contents, write security-events)

### 3. CodeQL Workflow (`.github/workflows/codeql.yml`)

**Trigger**:
- Push to `main`/`develop`
- PR to `main`/`develop`
- Weekly schedule
- Manual trigger

**Languages**: JavaScript, TypeScript

**Analysis**:
- Security vulnerability detection
- Code quality issues
- CWE (Common Weakness Enumeration) violations
- OWASP Top 10 coverage

**Queries**: 
- Security and quality queries
- Extended suite in `codeql.config.yml`

### 4. E2E Tests Workflow (`.github/workflows/e2e-tests.yml`)

**Trigger**: PR to `main`/`develop`, manual

**Setup**:
- Start PostgreSQL database
- Start Redis
- Seed test data
- Start API server
- Start web server

**Tests**:
- Playwright tests on Chrome, Firefox, Safari
- Screenshots on failure
- Video recording on failure
- HTML report generation

**Artifacts**:
- Test reports (7 days retention)
- Screenshots
- Videos

### 5. Deploy Workflow (`.github/workflows/deploy.yml`)

**Trigger**: Push to `main`, manual

**Environments**:
- Staging (automatic)
- Production (manual approval)

**Steps**:
1. Build all packages
2. Run security checks
3. Deploy API
4. Deploy Web
5. Run smoke tests
6. Notify team

## 🔐 Security Best Practices

### Permissions (Principle of Least Privilege)

```yaml
permissions:
  contents: read         # Read repository code
  checks: write         # Write check status
  pull-requests: write  # Comment on PRs
  security-events: write # Write security alerts (CodeQL only)
  actions: read         # Read workflow status
```

Never use: `permissions: write-all`

### Secrets Management

**Required Secrets**:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing key
- `SENTRY_DSN`: Sentry project DSN
- `CODECOV_TOKEN`: Codecov upload token
- `VERCEL_TOKEN`: Vercel deployment token (if using Vercel)

**Setting Secrets**:
```bash
# GitHub CLI
gh secret set SECRET_NAME

# GitHub UI
Settings → Secrets and variables → Actions → New repository secret
```

**Never commit**:
- `.env` files
- API keys
- Passwords
- Private keys
- Tokens

## 📊 Code Coverage

**Target**: 100% (configured in `codecov.yml`)

**Current Thresholds** (API):
- Branches: 80%
- Functions: 85%
- Lines: 88%
- Statements: 88%

**Viewing Coverage**:
1. **Local**:
   ```bash
   cd api && pnpm test:coverage
   # Open: coverage/lcov-report/index.html
   ```

2. **CI**: 
   - Codecov comment on PRs
   - Badge in README
   - Dashboard: https://codecov.io/gh/MrMiless44/Infamous-freight

**Improving Coverage**:
1. Identify uncovered lines in report
2. Add unit tests for missing cases
3. Add integration tests for workflows
4. Test edge cases and error paths

## 🚀 Deployment Process

### Staging Deployment

**Automatic** on merge to `main`:
1. CI passes all checks
2. Build artifacts created
3. Deploy to staging environment
4. Run smoke tests
5. Notify on Slack/Discord

### Production Deployment

**Manual approval required**:
1. Staging deployment successful
2. QA approval
3. Product owner approval
4. Trigger production deployment
5. Monitor for errors
6. Rollback if issues

### Rollback Procedure

```bash
# Via GitHub Actions
# Go to previous successful deployment
# Click "Re-run jobs"

# Via Vercel
vercel rollback

# Via Docker
docker pull infamous-freight/api:previous-tag
docker-compose up -d
```

## 🔧 Workflow Maintenance

### Adding New Workflow

1. Create `.github/workflows/my-workflow.yml`
2. Define trigger events
3. Set minimal permissions
4. Add jobs with steps
5. Test with `act` locally (optional)
6. Commit and push
7. Monitor first run

### Updating Workflow

1. Make changes in branch
2. Test in PR
3. Review Actions tab for results
4. Merge if successful
5. Update documentation

### Debugging Workflows

**View Logs**:
```bash
# GitHub CLI
gh run view <run-id>
gh run view <run-id> --log

# Or visit GitHub UI
Actions → Select workflow → Select run → View logs
```

**Enable Debug Logging**:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

**Common Issues**:
1. **Timeout**: Increase `timeout-minutes`
2. **Permission denied**: Check `permissions` block
3. **Cache miss**: Verify cache key
4. **Dependency issue**: Clear cache, reinstall

## 📈 Monitoring & Alerts

### GitHub Actions Status

**Check Status**:
- Repository → Actions tab
- Commit → Checks
- PR → Checks section

**Status Badge**:
```markdown
![CI](https://github.com/MrMiless44/Infamous-freight/workflows/CI/badge.svg)
```

### Email Notifications

Automatic for:
- Workflow failures
- Security alerts
- Scheduled jobs

Configure: Settings → Notifications

### Slack/Discord Integration

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 🎯 Best Practices

### 1. Fast Feedback
- Run quick checks first (lint, type check)
- Parallelize independent jobs
- Cache dependencies
- Fail fast on errors

### 2. Reproducible Builds
- Pin versions (`NODE_VERSION`, `PNPM_VERSION`)
- Use lockfiles (`pnpm-lock.yaml`)
- Consistent environments
- Docker for complex setups

### 3. Security First
- Minimal permissions
- Secret scanning
- Dependency audits
- Signed commits (optional)

### 4. Clear Reporting
- Descriptive job names
- Summary comments on PRs
- Upload artifacts for debugging
- Structured logs

### 5. Cost Optimization
- Timeout limits
- Cancel in-progress runs
- Efficient caching
- Conditional jobs

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Codecov Documentation](https://docs.codecov.com)

## 🤝 Contributing

When adding/modifying workflows:
1. Follow naming conventions
2. Document changes here
3. Test thoroughly
4. Get approval from DevOps team
5. Monitor first production run

## 📄 License

Proprietary - Copyright © 2025 Infæmous Freight. All Rights Reserved.
