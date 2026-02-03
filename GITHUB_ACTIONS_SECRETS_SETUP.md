# GitHub Actions Secrets Setup Guide

## For Infamous Freight Enterprises Infrastructure

This guide will help you configure GitHub Actions secrets for CI/CD pipeline operations.

---

## 1. Container Registry Authentication (GHCR)

### Why This Matters

The CI/CD pipeline needs to push Docker images to GitHub Container Registry (GHCR). This requires authentication tokens.

### Setup Steps

**Step 1: Create GitHub Personal Access Token (PAT)**

1. Go to GitHub Settings → Developer Settings → [Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Name it: `GHCR_TOKEN` or similar
4. Select scopes:
   - ✅ `write:packages` - Push to GHCR
   - ✅ `read:packages` - Pull from GHCR
   - ✅ `delete:packages` - Delete packages (cleanup)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

**Step 2: Add Secret to GitHub Repository**

1. Go to your GitHub repo → Settings → Secrets and Variables → Actions
2. Click "New repository secret"
3. Name: `GHCR_TOKEN`
4. Value: Paste the token from Step 1
5. Click "Add secret"

### Usage in Workflows

```yaml
# In .github/workflows/docker-build-push.yml
- name: Log in to GHCR
  uses: docker/login-action@v2
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GHCR_TOKEN }}
```

---

## 2. Docker Build Configuration

### Required Secrets

| Secret Name          | Purpose                                  | Example Value              |
| -------------------- | ---------------------------------------- | -------------------------- |
| `GHCR_TOKEN`         | Push images to GitHub Container Registry | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| `DOCKERHUB_USERNAME` | Optional: Docker Hub mirror              | `your-username`            |
| `DOCKERHUB_TOKEN`    | Optional: Docker Hub token               | `dckr_xxxxxxxxxxxx`        |

### Optional: Docker Hub Mirror

If you want to also push to Docker Hub:

1. Create Docker Hub access token at <https://hub.docker.com/settings/security>
2. Add to GitHub secrets:
   - Name: `DOCKERHUB_USERNAME`
   - Name: `DOCKERHUB_TOKEN`

---

## 3. Security Scanning Configuration

### Trivy Configuration

Trivy security scanning is **already configured** in `.github/workflows/docker-build-push.yml`

**Features:**

- Scans all built images
- Reports CRITICAL and HIGH severity issues
- Uploads SARIF format results to GitHub Security
- Creates GitHub Security advisories automatically

**View Results:**

1. Go to repo → Security tab → Code scanning
2. Review Trivy findings
3. Trivy automatically blocks builds with critical issues

### GitHub Security Dashboard

No additional setup needed! Security scanning automatically:

- Scans dependencies (npm audit)
- Scans container images (Trivy)
- Analyzes code (CodeQL)
- Integrates with GitHub Security tab

---

## 4. Deployment Configuration

### Optional: Slack Notifications

To notify your team of deployment status:

**Step 1: Create Slack Webhook**

1. Go to Slack Workspace → Settings → Apps
2. Search for "Incoming Webhooks"
3. Click "Add to Slack"
4. Select channel: e.g., `#deployments`
5. Click "Add Incoming Webhooks Integration"
6. Copy the **Webhook URL**

**Step 2: Add to GitHub Secrets**

1. Go to repo Settings → Secrets and Variables → Actions
2. Add secret:
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Paste webhook URL

**Step 3: Update Workflow** (Optional)

```yaml
- name: Notify Slack on Success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: custom
    custom_payload: |
      {
        text: 'Deployment successful: ${{ github.ref_name }}',
        attachments: [{ color: 'good', text: 'Image pushed to GHCR' }]
      }
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 5. Email Notifications (Optional)

### GitHub Notifications

No setup needed - GitHub sends notifications by default:

- Failed workflows email repo admins
- Enable in repo → Settings → Notifications

---

## 6. Verify Setup

### Test Your Configuration

```bash
# Verify GHCR token works
echo $GHCR_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin

# Test push (create a test tag)
docker pull alpine:latest
docker tag alpine:latest ghcr.io/your-org/infamous-freight/test:latest
docker push ghcr.io/your-org/infamous-freight/test:latest

# View images in GHCR
# Go to: https://github.com/users/your-username/packages/container/infamous-freight%2Ftest
```

### Check GitHub Actions Status

1. Go to repo → Actions tab
2. Watch for workflow runs
3. View logs in real-time
4. Check security scanning results

---

## 7. Multi-Platform Deployment Secrets (REQUIRED for 100%)

### 🚀 Fly.io API Deployment (REQUIRED)

**Deploy Express API to Fly.io**

| Secret          | Purpose                        | How to Get                | Required |
| --------------- | ------------------------------ | ------------------------- | -------- |
| `FLY_API_TOKEN` | Deploy API to Fly.io           | `flyctl auth token`       | ✅ YES    |
| `DATABASE_URL`  | Production database connection | From Railway or Supabase  | ✅ YES    |
| `JWT_SECRET`    | JWT signing key                | `openssl rand -base64 32` | ✅ YES    |

### ▲ Vercel Web Deployment (REQUIRED)

**Deploy Next.js web app to Vercel**

| Secret              | Purpose                | How to Get                            | Required |
| ------------------- | ---------------------- | ------------------------------------- | -------- |
| `VERCEL_TOKEN`      | Deploy to Vercel       | Vercel Dashboard → Settings → Tokens  | ✅ YES    |
| `VERCEL_ORG_ID`     | Vercel organization ID | Vercel Dashboard → Settings → General | ✅ YES    |
| `VERCEL_PROJECT_ID` | Vercel project ID      | Project Settings → General            | ✅ YES    |

### 🛤️ Railway Database (REQUIRED)

**Run Prisma migrations on Railway Postgres**

| Secret               | Purpose            | How to Get                           | Required |
| -------------------- | ------------------ | ------------------------------------ | -------- |
| `RAILWAY_TOKEN`      | Railway API token  | Railway Dashboard → Account → Tokens | ✅ YES    |
| `RAILWAY_PROJECT_ID` | Railway project ID | Railway Project → Settings           | ✅ YES    |

### 🧩 Supabase Deployment (REQUIRED)

**Deploy Edge Functions and DB migrations to Supabase**

| Secret                  | Purpose              | How to Get                                | Required |
| ----------------------- | -------------------- | ----------------------------------------- | -------- |
| `SUPABASE_ACCESS_TOKEN` | Supabase API token   | Supabase Dashboard → Settings → Tokens    | ✅ YES    |
| `SUPABASE_PROJECT_REF`  | Supabase project ref | Project Settings → General → Reference ID | ✅ YES    |
| `SUPABASE_DB_PASSWORD`  | Database password    | Project Settings → Database               | ✅ YES    |

**Step-by-Step: Get FLY_API_TOKEN**

```bash
# 1. Install Fly.io CLI
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"

# 2. Login to Fly.io
flyctl auth login

# 3. Get your token
flyctl auth token

# 4. Copy the token and add to GitHub Secrets
# Go to: https://github.com/YOUR-ORG/YOUR-REPO/settings/secrets/actions
# Name: FLY_API_TOKEN
# Value: [paste token]
```

**Step-by-Step: Get Vercel Secrets**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Get your token
# Go to: https://vercel.com/account/tokens
# Create token → Copy

# 4. Get Organization ID
# Go to: https://vercel.com/[your-org]/settings
# Copy Organization ID from Settings → General

# 5. Get Project ID
# Go to: https://vercel.com/[your-org]/[project]/settings
# Copy Project ID from Settings → General

# 6. Add all three to GitHub Secrets:
# - VERCEL_TOKEN
# - VERCEL_ORG_ID
# - VERCEL_PROJECT_ID
```

**Step-by-Step: Get Railway Secrets**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Get your token
# Go to: https://railway.app/account/tokens
# Create token → Copy

# 4. Get Project ID
# Go to your Railway project → Settings → General
# Copy Project ID

# 5. Add to GitHub Secrets:
# - RAILWAY_TOKEN
# - RAILWAY_PROJECT_ID
```

**Step-by-Step: Get Supabase Secrets**

```bash
# 1. Go to Supabase Dashboard
# https://supabase.com/dashboard

# 2. Create or select project

# 3. Get Access Token
# Go to: https://supabase.com/dashboard/account/tokens
# Create token → Copy

# 4. Get Project Reference ID
# Project Settings → General → Reference ID

# 5. Get Database Password
# Project Settings → Database → Connection String
# Password is in the connection string or reset in Database settings

# 6. Add to GitHub Secrets:
# - SUPABASE_ACCESS_TOKEN
# - SUPABASE_PROJECT_REF
# - SUPABASE_DB_PASSWORD
```

**Step-by-Step: Get DATABASE_URL**

Option A - Railway Postgres (Recommended for this setup):
```bash
# 1. Go to Railway project
# 2. Add New → Database → PostgreSQL
# 3. Click on the Postgres service
# 4. Variables tab → Copy DATABASE_URL
# 5. Add to GitHub Secrets (also used by Railway workflow)
```

Option B - Supabase (Alternative):
```bash
# 1. Go to: https://supabase.com/dashboard
# 2. Create project: "infamous-freight"
# 3. Settings → Database → Connection String (Direct)
# 4. Copy and add to GitHub Secrets
```

**Step-by-Step: Generate JWT_SECRET**

```bash
# Generate secure random key
openssl rand -base64 32

# Copy output and add to GitHub Secrets
# Name: JWT_SECRET
# Value: [paste generated key]
```

### Additional Production Secrets (Optional)

| Secret                | Purpose                  | Setup                                           |
| --------------------- | ------------------------ | ----------------------------------------------- |
| `FLY_APP_NAME`        | Fly.io app name override | Set to `infamous-freight`                       |
| `API_PORT`            | API server port override | Set to `4000` or custom                         |
| `STRIPE_SECRET_KEY`   | Stripe API key           | From Stripe Dashboard                           |
| `SENDGRID_API_KEY`    | Email service            | From SendGrid Dashboard                         |
| `SENTRY_AUTH_TOKEN`   | Error tracking           | From Sentry.io                                  |
| `SLACK_WEBHOOK_URL`   | Deployment notifications | From Slack Workspace → Apps → Incoming Webhooks |
| `DISCORD_WEBHOOK_URL` | Deployment notifications | Server Settings → Integrations → Create Webhook |

**⚠️ Never commit secrets to version control!**

### Setup Notification Webhooks (Optional)

**Quick Setup (Recommended):**
```bash
# Run interactive setup script
./scripts/setup-notifications.sh

# The script guides you through:
# - Slack webhook setup
# - Discord webhook setup
# - Automatic secret configuration
# - URL validation
```

**Manual Setup:**

**Slack Webhook:**
```bash
# 1. Go to: https://api.slack.com/apps
# 2. Create New App → From scratch
# 3. Name: "Deployment Notifier", select workspace
# 4. Features → Incoming Webhooks → Activate
# 5. Add New Webhook to Workspace
# 6. Select channel (e.g., #deployments)
# 7. Copy webhook URL and set secret:
gh secret set SLACK_WEBHOOK_URL
```

**Discord Webhook:**
```bash
# 1. Go to your Discord server
# 2. Server Settings → Integrations → Webhooks
# 3. Create Webhook
# 4. Name: "Deployment Notifier", select channel
# 5. Copy webhook URL and set secret:
gh secret set DISCORD_WEBHOOK_URL
```

**⚠️ Never commit secrets to version control!**

### Verify All Secrets Are Set

```bash
# Using GitHub CLI
gh secret list

# Expected output for multi-platform deploy:
# FLY_API_TOKEN           Updated 2026-02-03
# VERCEL_TOKEN            Updated 2026-02-03
# VERCEL_ORG_ID           Updated 2026-02-03
# VERCEL_PROJECT_ID       Updated 2026-02-03
# RAILWAY_TOKEN           Updated 2026-02-03
# RAILWAY_PROJECT_ID      Updated 2026-02-03
# SUPABASE_ACCESS_TOKEN   Updated 2026-02-03
# SUPABASE_PROJECT_REF    Updated 2026-02-03
# SUPABASE_DB_PASSWORD    Updated 2026-02-03
# DATABASE_URL            Updated 2026-02-03
# JWT_SECRET              Updated 2026-02-03
# GHCR_TOKEN              Updated 2026-02-03
```

**Run automated validation script:**

```bash
# Check if all required secrets are configured
./scripts/validate-secrets.sh
```

---

## 8. Trigger Multi-Platform Deployment

### Automated Validation & Deployment

Once all secrets are configured, use the automated scripts:

**Step 1: Validate Secrets**

```bash
# Run validation script
./scripts/validate-secrets.sh

# Expected output:
# ✓ All required secrets are configured! (11/11)
# ✓ Optional secrets configured: 4/4
# 🚀 Ready to deploy!
```

**Step 2: Trigger Deployment**

```bash
# Trigger manual deployment
./scripts/trigger-deploy.sh

# This will:
# 1. Validate secrets
# 2. Confirm deployment targets
# 3. Trigger GitHub Actions workflow
# 4. Provide links to watch progress
```

### Manual Deployment via GitHub UI

1. Go to: https://github.com/YOUR-ORG/YOUR-REPO/actions
2. Select "Deploy ALL Platforms" workflow
3. Click "Run workflow" button
4. Select branch: `main`
5. Click green "Run workflow" button

### Manual Deployment via GitHub CLI

```bash
# Trigger workflow
gh workflow run deploy-all.yml --ref main

# Watch progress
gh run watch

# View latest run
gh run list --workflow=deploy-all.yml --limit 1
```

### Verify Deployment

After workflow completes, check each platform:

**Fly.io API:**
```bash
# Check health
curl https://infamous-freight-api.fly.dev/api/health | jq .

# View logs
flyctl logs -a infamous-freight-api
```

**Vercel Web:**
```bash
# Visit deployed site
open https://YOUR-PROJECT.vercel.app

# Check Vercel logs
vercel logs
```

**Railway Database:**
```bash
# Check migrations
railway run pnpm --filter api prisma:migrate:status
```

**Supabase:**
```bash
# Check edge functions
supabase functions list

# Check database
supabase db remote status
```

---

## 9. Quick Reference: Commands

```bash
# Generate a secure random secret
openssl rand -base64 32

# Test GitHub token
curl -H "Authorization: token $GHCR_TOKEN" https://api.github.com/user

# List GitHub secrets (locally)
# (Note: Secrets are write-only in GitHub)
gh secret list -R your-org/your-repo

# Delete a secret
gh secret delete SECRET_NAME -R your-org/your-repo
```

---

## 10. Troubleshooting

### Secret Not Found Error

```
Error: Secrets are not passed to workflows triggered from a forked repository
```

**Solution:** Make sure you're on the main repo, not a fork

### Docker Login Failed

```
Error: Unauthorized: authentication required
```

**Solution:** Verify GHCR_TOKEN is correctly set and has `write:packages` scope

### Build Succeeds But No Image Appears

**Cause:** Token doesn't have correct permissions  
**Solution:** Regenerate token with `write:packages` scope

---

## 11. Deployment Checklist

### Pre-Deployment

- [ ] All 11 required secrets configured
- [ ] Secrets validated with `./scripts/validate-secrets.sh`
- [ ] Local changes committed and pushed
- [ ] Code passes tests locally (`pnpm test`)
- [ ] No open GitHub Issues blocking deployment

### During Deployment

- [ ] Workflow triggered (manual or push to main)
- [ ] Fly.io deployment completed without errors
- [ ] Vercel deployment completed without errors
- [ ] Railway migrations completed successfully
- [ ] Supabase edge functions deployed
- [ ] All health checks passed

### Post-Deployment

- [ ] API health check: `curl https://APP-NAME.fly.dev/api/health`
- [ ] Web app loads: Visit Vercel URL
- [ ] Database accessible from API
- [ ] Edge functions responding
- [ ] Monitor logs for errors (first 5 minutes)
- [ ] Test critical user flows
- [ ] Update team/stakeholders

---

## 12. Monitoring & Maintenance

### Rotate Secrets Regularly

- GHCR tokens: Every 90 days
- Database passwords: Every 60 days
- API keys: Based on provider recommendations

### Review Access

```bash
# GitHub CLI: List active tokens (requires admin)
gh api /user/installations --jq '.installations[] | select(.app.name=="GitHub Actions")'
```

### Audit Logs

GitHub automatically logs:

- Secret access attempts
- Workflow execution failures
- Deployment history

View in: Repo → Settings → Audit log

---

## 13. Security Best Practices

✅ **DO:**

- Rotate secrets regularly
- Use fine-grained permissions (least privilege)
- Enable branch protection rules
- Require status checks before merge
- Use environment secrets for production

❌ **DON'T:**

- Commit secrets to git (add to .gitignore)
- Share secrets in chat/email
- Use personal access tokens for bots (use GitHub App instead)
- Leave tokens in environment variables permanently

---

## 14. Need Help?

### Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GHCR Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Trivy Security Scanning](https://aquasecurity.github.io/trivy/)

### Report Issues

1. Check repo → Security tab → Code scanning
2. Review workflow logs: Actions tab → Failed run → View logs
3. Enable debug logging: Set secret `ACTIONS_STEP_DEBUG=true`

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: ✅ Complete
