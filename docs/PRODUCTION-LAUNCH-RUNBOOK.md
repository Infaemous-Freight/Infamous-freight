# Production Launch Runbook

This runbook covers the final production steps for Infamous Freight after the frontend is live and the API deployment is still blocked.

## Current production architecture

- Frontend: Netlify, `https://www.infamousfreight.com`
- API app: Fly.io, `infamous-freight`
- Fly API URL: `https://infamous-freight.fly.dev`
- Frontend API base URL: `/api`
- Netlify API proxy target: `https://infamous-freight.fly.dev/api/:splat`

## Security first

A Fly token was previously exposed in chat. Treat it as compromised.

Required actions:

1. Revoke the exposed Fly token.
2. Create a new Fly deploy token.
3. Add the new token to GitHub Actions secrets as `FLY_API_TOKEN`.
4. Do not paste deploy tokens into chat, commit history, issue comments, logs, or docs.

## GitHub secret setup

Go to:

```text
GitHub repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Create:

```text
Name: FLY_API_TOKEN
Value: new rotated Fly deploy token
```

## Deploy API

Go to:

```text
GitHub repository -> Actions -> Deploy Fly API -> Run workflow
```

The workflow deploys the API to Fly app `infamous-freight` and checks:

```text
https://infamous-freight.fly.dev/api/health
```

## Redeploy frontend

After confirming the API deploy, redeploy the Netlify frontend so production uses the current env configuration.

Go to:

```text
Netlify -> infamousfreight project -> Deploys -> Trigger deploy -> Deploy site
```

## Smoke test

Go to:

```text
GitHub repository -> Actions -> Smoke Test -> Run workflow
```

Or run manually:

```bash
curl -i https://www.infamousfreight.com
curl -i https://infamous-freight.fly.dev/health
curl -i https://infamous-freight.fly.dev/api/health
curl -i https://www.infamousfreight.com/api/health
```

Expected result:

```text
HTTP 200 from frontend, Fly API health, and proxied API health.
```

## Launch gate

Do not mark production ready until all of these pass:

- `https://www.infamousfreight.com` returns HTTP 200.
- `https://infamous-freight.fly.dev/health` returns HTTP 200.
- `https://infamous-freight.fly.dev/api/health` returns HTTP 200.
- `https://www.infamousfreight.com/api/health` returns HTTP 200.

## Rollback

If API deployment fails:

1. Check GitHub Actions logs for the `Deploy Fly API` workflow.
2. Check Fly app logs from a trusted shell:

```bash
flyctl logs --app infamous-freight
flyctl status --app infamous-freight
flyctl machines list --app infamous-freight
```

3. Confirm required runtime env vars exist in Fly, especially `DATABASE_URL`.
4. Do not launch until the health endpoints are stable.
