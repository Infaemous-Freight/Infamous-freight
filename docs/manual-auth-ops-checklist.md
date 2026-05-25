# Manual Authenticated Operations Checklist

This checklist captures actions that require authenticated access to GitHub, Netlify, PagerDuty, and Supabase.

## 1) Open GitHub PR

```bash
cd /home/ubuntu/Infamous-freight

git remote -v
git remote add origin https://github.com/Infaemous-Freight/Infamous-freight.git 2>/dev/null || true
git fetch origin

gh auth login
gh pr create \
  --title "feat: implement all recommended actions + Netlify deployment" \
  --body "All recommended actions for production deployment." \
  --base main \
  --head all-recommended-actions
```

## 2) Wait for CI/CD

```bash
gh pr checks --watch
```

Confirm required checks (tests + security scans) are green in GitHub Actions.

## 3) Merge PR

```bash
gh pr merge --squash --delete-branch
```

## 4) Verify deployment

```bash
curl -I https://www.infamousfreight.com
curl https://www.infamousfreight.com/api/health
curl https://www.infamousfreight.com/api/metrics
curl https://www.infamousfreight.com/api/health/performance
curl https://www.infamousfreight.com/api/health/database
curl -I https://infamousfreight.com
curl -i https://infamous-freight-api.fly.dev/api/health/live
```

## 5) Netlify

- Add/update required environment variables.
- Remove old secrets.
- Redeploy site.

## 6) PagerDuty

- Create/get a routing key in PagerDuty.
- Add to Netlify env vars:

```bash
PAGERDUTY_ROUTING_KEY=<set-in-netlify-ui>
```

## 7) Supabase

- Go to **Authentication → Security**.
- Enable leaked password protection.

## Risk check

- Never paste secrets in PR bodies, logs, issues, screenshots, or chat.
- Rotate any secret if exposure is suspected.
- For Fly health diagnostics, separate `/api/health/live` (liveness) from `/api/health` (readiness/dependency status).

## Fast fallback

If CI fails:
1. Capture failing job logs.
2. Fix on a small follow-up branch.
3. Re-run checks before merge.
