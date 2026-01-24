# GitHub Actions Workflows Documentation

This document describes all GitHub Actions workflows in this repository and their purpose.

## 📋 Overview

The repository uses GitHub Actions for continuous integration, deployment, and security scanning. All workflows follow enterprise-grade best practices with minimal permissions.

## 🔄 CI/CD Workflows

### CI - Enterprise Grade (`.github/workflows/ci.yml`)

**Triggers**: Push to `main`/`develop`, PRs

**Purpose**: Main CI pipeline that validates code quality, runs tests, and builds the project.

**Jobs**:
1. **validate** - Repository structure validation
   - No package-lock.json (pnpm only)
   - No committed node_modules
   
2. **lint** - Code quality checks
   - ESLint for API
   - Prettier format checking
   
3. **typecheck** - Type safety
   - Build shared package
   - Type check all TypeScript packages
   
4. **test** - Test execution
   - Run API tests with coverage
   - Upload coverage to Codecov
   
5. **build** - Production build verification
   - Build shared package
   - Build API
   - Build web (if configured)
   - Upload build artifacts

**Environment Variables**:
- `NODE_VERSION`: 22.16.0
- `PNPM_VERSION`: 9.15.0

**Permissions**: `contents: read`, `checks: write`, `pull-requests: write`

**Concurrency**: Cancels previous runs on same ref

---

### Commit Message Lint (`.github/workflows/commitlint.yml`)

**Triggers**: Pull requests

**Purpose**: Enforce Conventional Commits standard for commit messages.

**Jobs**:
1. **commitlint** - Validate commit messages
   - Checks all commits in PR
   - Validates against commitlint config
   
2. **PR title validation** - Ensure PR title follows format
   - Must be: `type(scope): subject`
   - Subject must start with uppercase

**Required Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`

**Permissions**: `contents: read`, `pull-requests: write`

---

### API Tests (`.github/workflows/api-tests.yml`)

**Triggers**: Push, PRs

**Purpose**: Dedicated workflow for API testing.

**Jobs**:
1. Run API tests with coverage
2. Report test results

**Permissions**: `contents: read`

---

### E2E Tests (`.github/workflows/e2e-tests.yml`)

**Triggers**: Push to `main`, PRs

**Purpose**: End-to-end testing with Playwright.

**Jobs**:
1. Install dependencies
2. Run Playwright tests
3. Upload test results and traces

**Permissions**: `contents: read`

---

## 🔒 Security Workflows

### CodeQL Analysis (`.github/workflows/codeql.yml`)

**Triggers**: 
- Push to `main`/`develop`
- PRs
- Schedule: Weekly on Monday

**Purpose**: Static analysis security testing (SAST) for vulnerabilities.

**Languages**: JavaScript, TypeScript

**Permissions**: `contents: read`, `security-events: write`, `actions: read`

**Best Practices**:
- Runs on schedule to catch new vulnerabilities
- Uses GitHub's CodeQL engine
- Uploads results to Security tab

---

### Secret Scanning (`.github/workflows/secret-scanning.yml`)

**Triggers**:
- Push to `main`/`develop`
- PRs
- Schedule: Daily at 2 AM UTC
- Manual dispatch

**Purpose**: Scan repository for leaked secrets and credentials.

**Jobs**:
1. **trufflehog** - Comprehensive secret scanning
   - Scans entire history
   - Only reports verified secrets
   - Uploads results as artifact
   
2. **gitleaks** - Additional secret scanning
   - Fast, focused scanning
   - Checks against known patterns
   
3. **security-summary** - Aggregated results
   - Reports status of both tools
   - Fails if secrets detected

**Permissions**: `contents: read`, `issues: write`, `pull-requests: write`, `security-events: write`

---

### Security Workflow (`.github/workflows/security.yml`)

**Triggers**: Push, PRs, Schedule (weekly)

**Purpose**: Comprehensive security checks.

**Jobs**:
1. Dependency audit
2. Vulnerability scanning
3. License compliance

**Permissions**: `contents: read`, `security-events: write`

---

## 🚀 Deployment Workflows

### Deploy (`.github/workflows/deploy.yml`)

**Triggers**: Push to `main`, manual dispatch

**Purpose**: Deploy to production/staging environments.

**Jobs**:
1. Build all packages
2. Deploy API
3. Deploy Web
4. Smoke tests

**Permissions**: `contents: read`, `deployments: write`

**Secrets Required**:
- `DEPLOY_TOKEN`
- `API_URL`
- Other environment-specific secrets

---

## 🔄 Reusable Workflows

### Reusable Build (`.github/workflows/reusable-build.yml`)

**Purpose**: Shared build logic for consistency.

**Inputs**:
- `package-name`: Package to build
- `node-version`: Node.js version
- `pnpm-version`: pnpm version

**Usage**:
```yaml
jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      package-name: api
      node-version: '22'
```

---

### Reusable Test (`.github/workflows/reusable-test.yml`)

**Purpose**: Shared test execution logic.

**Inputs**:
- `package-name`: Package to test
- `coverage-threshold`: Minimum coverage required

---

### Reusable Deploy (`.github/workflows/reusable-deploy.yml`)

**Purpose**: Shared deployment logic.

**Inputs**:
- `environment`: Deployment environment
- `package-name`: Package to deploy

---

## 📊 Workflow Best Practices

### Security

✅ **DO**:
- Use minimal permissions (`contents: read` by default)
- Pin action versions with SHA hashes
- Use `GITHUB_TOKEN` for authentication
- Store secrets in GitHub Secrets
- Use environment protection rules

❌ **DON'T**:
- Grant `write: all` permissions
- Use PATs unless absolutely necessary
- Hardcode secrets in workflows
- Skip security scans

### Performance

✅ **DO**:
- Use concurrency groups to cancel outdated runs
- Cache dependencies (`pnpm` cache, Docker layers)
- Set appropriate timeouts
- Use job dependencies for parallel execution

❌ **DON'T**:
- Run all jobs sequentially
- Skip caching
- Set excessive timeouts

### Reliability

✅ **DO**:
- Set timeout limits on jobs
- Use `continue-on-error` for non-critical steps
- Upload artifacts for debugging
- Add status checks to PRs

❌ **DON'T**:
- Let jobs run indefinitely
- Fail silently without logs
- Ignore test failures

---

## 🔧 Configuration Files

### Codecov (`codecov.yml`)

**Purpose**: Configure code coverage reporting and requirements.

**Key Settings**:
- Target: 100% coverage
- Threshold: 5% tolerance
- Range: 90-100%
- Flags: `api`, `web`, `shared`

**Ignored Paths**:
- `node_modules/`
- `coverage/`
- `dist/`
- `**/__tests__/**`
- `**/*.test.js`

---

### Commitlint (`commitlint.config.js`)

**Purpose**: Enforce commit message standards.

**Format**: `type(scope): subject`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `perf`: Performance
- `test`: Tests
- `chore`: Maintenance
- `ci`: CI/CD
- `revert`: Revert commit

**Rules**:
- Subject must be sentence case
- No trailing period
- Type must be from allowed list

---

## 📈 Monitoring and Reporting

### Coverage Reports

- Generated by Jest
- Uploaded to Codecov
- Available in PR comments
- Historical tracking in Codecov dashboard

### Security Alerts

- CodeQL results in Security tab
- Secret scanning alerts
- Dependabot security updates
- Manual review required for critical issues

### Build Artifacts

**Stored for 7 days**:
- Build outputs
- Test results
- Coverage reports
- Playwright traces

---

## 🚨 Troubleshooting Workflows

### Workflow Fails on Dependency Install

**Solution**:
```bash
# Update lockfile
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

### CodeQL Analysis Fails

**Common Causes**:
- Syntax errors in code
- Build failures
- Timeout issues

**Solution**: Check the CodeQL logs in Actions tab

### Secret Scanning False Positives

**Solution**: Add to `.gitignore` or use `.trufflehogignore`

### Coverage Below Threshold

**Solution**:
1. Add missing tests
2. Check coverage report: `pnpm test:coverage`
3. Review uncovered lines
4. Consider adjusting thresholds if justified

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Codecov Documentation](https://docs.codecov.com/)
- [TruffleHog Documentation](https://github.com/trufflesecurity/trufflehog)

---

## 🔄 Updating Workflows

When modifying workflows:

1. **Test locally** with [act](https://github.com/nektos/act) if possible
2. **Use draft PRs** to test workflow changes
3. **Review logs** carefully after changes
4. **Document** significant changes in this file
5. **Follow security best practices**

---

## 📞 Support

For workflow issues:
- Check Actions tab for detailed logs
- Review this documentation
- Open an issue with workflow run link
- Tag with `ci/cd` label

---

**Last Updated**: 2026-01-24
**Maintained By**: DevOps Team
