# Launch Readiness Checklist

This checklist is the source of truth for moving Infamous Freight from merged code to production-ready status.

## Blocker

Production is not ready until issue #1554 is complete.

## Account-level actions

These require access to Fly.io, GitHub repository secrets, and Netlify.

- [ ] Revoke the exposed Fly token.
- [ ] Create a new Fly deploy token.
- [ ] Add the new token as GitHub Actions secret `FLY_API_TOKEN`.
- [ ] Run the `Deploy Fly API` workflow.
- [ ] Trigger a Netlify production redeploy.
- [ ] Run the `Smoke Test` workflow.

## Required production health checks

Run these after deployment:

```bash
curl -i https://infamous-freight.fly.dev/health
curl -i https://infamous-freight.fly.dev/api/health
curl -i https://www.infamousfreight.com/api/health
```

Expected result: HTTP 200 from all three endpoints.

## Production environment expectations

Set production CORS explicitly:

```bash
CORS_ORIGINS=https://infamousfreight.com,https://www.infamousfreight.com
```

Set frontend API routing to the Netlify proxy path:

```bash
VITE_API_URL=/api
```

## Merge policy

- Use fresh branches from current `main`.
- Keep PRs focused.
- Require CI to pass before merge.
- Squash merge.
- Delete temporary branches after merge.
- Do not revive stale duplicate PRs; cherry-pick unique changes into fresh branches.

## Not production ready if

- `FLY_API_TOKEN` is missing or stale.
- Fly `/health` fails.
- Fly `/api/health` fails.
- Public proxied `/api/health` fails.
- Netlify has not been redeployed after env changes.
