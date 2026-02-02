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

## 7. Production Secrets (Optional)

For production deployments, also configure:

| Secret              | Purpose                        | Setup                        |
| ------------------- | ------------------------------ | ---------------------------- |
| `API_PORT`          | API server port override       | Set to `4000` or custom      |
| `DATABASE_URL`      | Production database connection | PostgreSQL connection string |
| `JWT_SECRET`        | JWT signing key                | 32-character random string   |
| `STRIPE_SECRET_KEY` | Stripe API key                 | From Stripe Dashboard        |
| `SENDGRID_API_KEY`  | Email service                  | From SendGrid Dashboard      |

**⚠️ Never commit secrets to version control!**

---

## 8. Quick Reference: Commands

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

## 9. Troubleshooting

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

## 10. Monitoring & Maintenance

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

## 11. Security Best Practices

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

## Need Help?

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
