# GitHub Repository Settings Guide

This guide helps you configure recommended settings for the Infamous Freight Enterprises repository.

## 🔒 Branch Protection Rules

### Main Branch Protection

Navigate to: **Settings → Branches → Add rule**

**Branch name pattern:** `main`

#### Required Settings

✅ **Require a pull request before merging**

- Require approvals: 1
- Dismiss stale pull request approvals when new commits are pushed
- Require review from Code Owners (optional)

✅ **Require status checks to pass before merging**

- Require branches to be up to date before merging
- Status checks that are required:
  - `security-audit`
  - `lint-build`
  - `test-coverage`
  - `smoke-tests`

✅ **Require conversation resolution before merging**

✅ **Require signed commits** (recommended)

✅ **Include administrators** (recommended for consistency)

✅ **Restrict who can push to matching branches**

- Only allow specific people or teams (optional)

### Develop Branch (if using)

Same rules as main, but with:

- Require approvals: 1
- Less strict status checks if needed for faster iteration

## 🏷️ Labels

Create these labels for better organization:

### Type Labels

- `bug` - Something isn't working (red)
- `feat` - New feature (green)
- `fix` - Bug fix (orange)
- `docs` - Documentation (blue)
- `refactor` - Code refactoring (purple)
- `test` - Testing related (yellow)
- `chore` - Maintenance tasks (gray)

### Priority Labels

- `priority: critical` - Critical priority (darkred)
- `priority: high` - High priority (red)
- `priority: medium` - Medium priority (orange)
- `priority: low` - Low priority (yellow)

### Status Labels

- `status: in-progress` - Currently being worked on (yellow)
- `status: blocked` - Blocked by another issue (red)
- `status: needs-review` - Needs code review (blue)
- `status: ready` - Ready for work (green)

### Component Labels

- `api` - Backend API (blue)
- `web` - Frontend web app (green)
- `mobile` - Mobile app (purple)
- `shared` - Shared package (orange)
- `ci` - CI/CD pipeline (gray)
- `dependencies` - Dependency updates (pink)
- `security` - Security related (darkred)

### Automated Labels

- `automated` - Created by automation (gray)
- `dependabot` - Created by Dependabot (blue)

## 📋 Repository Settings

### General

**Settings → General**

✅ **Template repository:** Disabled

✅ **Require contributors to sign off on web-based commits:** Enabled

✅ **Allow squash merging:** Enabled

- Default to pull request title and commit details

✅ **Allow merge commits:** Disabled

✅ **Allow rebase merging:** Disabled

✅ **Automatically delete head branches:** Enabled

### Pull Requests

✅ **Allow auto-merge:** Enabled

✅ **Automatically delete head branches:** Enabled

### Security

**Settings → Security → Code security and analysis**

✅ **Dependency graph:** Enabled

✅ **Dependabot alerts:** Enabled

✅ **Dependabot security updates:** Enabled

✅ **CodeQL analysis:** Enabled (via workflow)

✅ **Secret scanning:** Enabled

✅ **Push protection:** Enabled

## 🔔 Notifications

### Repository Notifications

**Settings → Notifications**

Configure team notifications for:

- Pull request reviews
- CI/CD failures
- Security alerts
- Dependabot updates

## 🤝 Collaborators & Teams

**Settings → Collaborators and teams**

### Recommended Structure

**Teams:**

- `@org/core-maintainers` - Admin access
- `@org/developers` - Write access
- `@org/reviewers` - Read access + review ability

### Access Levels

- **Admin:** Repository owners only
- **Maintain:** Senior developers
- **Write:** Active contributors
- **Read:** All team members

## 🔑 Secrets and Variables

**Settings → Secrets and variables → Actions**

### Required Secrets

Create these secrets for CI/CD:

```
CODECOV_TOKEN         # From codecov.io
SENTRY_DSN           # From sentry.io (optional)
NPM_TOKEN            # If publishing packages (optional)
```

### Required Variables

```
NODE_VERSION=20
PNPM_VERSION=8
```

## 🔐 GitHub OAuth App (Supabase Auth)

Use this when configuring GitHub OAuth for Supabase Auth.

### GitHub OAuth App Settings

**Application name**

Infæmous Freight Enterprises  
(If GitHub rejects “Æ”, use **Infamous Freight Enterprises**.)

**Homepage URL (Website URL)**

Use your production site URL:

- <https://infamous-freight.netlify.app>
- <https://infamous-freight.vercel.app>

**Authorization callback URL (must match exactly)**

```
https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
```

Replace `<YOUR-PROJECT-REF>` with your Supabase project ref (the ID in your Supabase URL).

**Example**

```
https://abcd1234efgh5678.supabase.co/auth/v1/callback
```

### Supabase Dashboard Settings (Must Match)

Go to **Supabase → Authentication → Providers → GitHub** and add:

- **Client ID** = from GitHub OAuth App
- **Client Secret** = from GitHub OAuth App

Then go to **Authentication → URL Configuration** and set:

**Site URL**

- <https://infamous-freight.netlify.app>
- <https://infamous-freight.vercel.app>

**Redirect URLs**

- <http://localhost:3000/>**
- <https://infamous-freight.netlify.app/>**
- <https://infamous-freight.vercel.app/>**

### Frontend Supabase JS Usage

```ts
await supabase.auth.signInWithOAuth({
  provider: "github",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

On your `/auth/callback` page, call:

```ts
await supabase.auth.getSession();
```

## 📊 Insights Settings

Enable insights for better project visibility:

✅ **Pulse:** Track repository activity
✅ **Contributors:** Show contributor statistics
✅ **Community:** Monitor community health
✅ **Traffic:** Track views and clones
✅ **Commits:** Analyze commit patterns

## 🚀 Actions Settings

**Settings → Actions → General**

✅ **Actions permissions:** Allow all actions and reusable workflows

✅ **Workflow permissions:** Read and write permissions

✅ **Allow GitHub Actions to create and approve pull requests:** Enabled

### Cache Settings

✅ **Cache storage:** 10 GB (default)
✅ **Cache retention:** 7 days

## 📧 Webhooks (Optional)

**Settings → Webhooks**

Consider setting up webhooks for:

- Slack/Discord notifications
- External CI/CD systems
- Monitoring tools
- Project management integrations

## ✅ Verification Checklist

After configuration, verify:

- [x] Branch protection rules active on `main`
- [x] Required status checks configured
- [x] Dependabot enabled and configured
- [x] CodeQL security scanning running
- [x] Secret scanning enabled
- [x] Labels created and organized
- [x] Team permissions set correctly
- [x] CI/CD secrets configured
- [x] Auto-delete branches enabled
- [x] Signed commits required (optional)

## 🔄 Regular Maintenance

### Weekly

- Review Dependabot PRs
- Check security alerts
- Monitor CI/CD failures

### Monthly

- Review and update branch protection rules
- Audit team access and permissions
- Clean up stale branches
- Review security scan results

### Quarterly

- Update labels and project structure
- Review and update documentation
- Audit webhooks and integrations
- Update CI/CD workflows

## 📚 References

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Analysis](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/about-code-scanning-with-codeql)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Note:** Some settings require admin access to the repository. Contact repository owners if you don't have sufficient permissions.
