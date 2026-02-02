# Dependabot Setup Guide

GitHub's Dependabot automatically scans your repository for vulnerable dependencies and can automatically create pull requests to update them.

## Enable Dependabot Alerts

1. Go to your repository: <https://github.com/MrMiless44/Infamous-freight-enterprises>
2. Click **Settings** (top navigation)
3. Navigate to **Code security and analysis** (left sidebar)
4. Enable the following toggles:
   - ✅ **Dependabot alerts** - Get notified about vulnerable dependencies
   - ✅ **Dependabot security updates** - Auto-create PRs to fix vulnerabilities
   - ✅ **Secret scanning** - Detect exposed secrets

## Configure Dependabot

Create or edit `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Root-level dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
    open-pull-requests-limit: 5
    reviewers:
      - "MrMiless44"

  # API service
  - package-ecosystem: "npm"
    directory: "/api"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:30"
    open-pull-requests-limit: 5
    reviewers:
      - "MrMiless44"

  # Web application
  - package-ecosystem: "npm"
    directory: "/web"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "04:00"
    open-pull-requests-limit: 5
    reviewers:
      - "MrMiless44"

  # Infamous-freight-ai subdirectories
  - package-ecosystem: "npm"
    directory: "/infamous-freight-ai/api"
    schedule:
      interval: "weekly"
      day: "tuesday"
      time: "03:00"
    open-pull-requests-limit: 3

  - package-ecosystem: "npm"
    directory: "/infamous-freight-ai/web"
    schedule:
      interval: "weekly"
      day: "tuesday"
      time: "03:30"
    open-pull-requests-limit: 3

  - package-ecosystem: "npm"
    directory: "/infamous-freight-ai/mobile"
    schedule:
      interval: "weekly"
      day: "tuesday"
      time: "04:00"
    open-pull-requests-limit: 3
```

## GitHub Actions Integration

Your CI/CD pipeline in `.github/workflows/ci.yml` now includes:

- **Security Audit**: Runs `npm audit` on all package directories before tests
- **Test Coverage**: Automatically generates coverage reports (Codecov integration)
- **Smoke Tests**: Validates API health endpoints
- **Lint & Build**: Ensures code quality

These will run on:

- Every push to `main` or `develop`
- Every pull request to `main` or `develop`

### Uploading Test Results to Codecov

To upload test results to Codecov, add the following step in your GitHub Actions workflow:

```yaml
- name: Upload test results to Codecov
  if: ${{ !cancelled() }}
  uses: codecov/test-results-action@v1
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
```

## Best Practices

1. **Review Dependabot PRs promptly** - They help maintain security
2. **Test before merging** - CI/CD pipeline will validate changes
3. **Monitor Dependabot alerts** - Check the Security tab regularly
4. **Keep development branch updated** - Pull dependencies frequently
5. **Use semantic versioning** - Helps identify breaking changes

## Monitoring

Check your project's security status:

- GitHub → Security tab → Dependabot alerts
- GitHub → Actions tab → CI workflow status
- Codecov dashboard (if integrated): codecov.io/github/MrMiless44/Infamous-freight-enterprises

## Troubleshooting

- **PRs failing CI**: Review the error in the Actions tab
- **Multiple dependency versions**: Ensure `npm ci` is used (not `npm install`)
- **Merge conflicts**: Rebase the PR or let Dependabot update it
