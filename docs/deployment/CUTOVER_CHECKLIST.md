# Production Cutover Checklist

## Before cutover

- [ ] Supabase production database is provisioned
- [ ] Render API service is deployed and healthy
- [ ] Render worker is deployed and connected to Redis
- [ ] Vercel web project for `apps/web` is deployed from `main`
- [ ] Production environment variables are set in Vercel and Render
- [ ] Cloudflare zone is active for `infamousfreight.com`

## Validation targets

- [ ] `https://api.infamousfreight.com/health` returns success
- [ ] `https://api.infamousfreight.com/api/health` returns success
- [ ] `https://www.infamousfreight.com` loads correctly
- [ ] Frontend API calls resolve against `https://api.infamousfreight.com/api`
- [ ] Stripe webhook endpoint is reachable at `https://hooks.infamousfreight.com/api/webhooks/stripe`
- [ ] CORS allows `www.infamousfreight.com`, `app.infamousfreight.com`, and `portal.infamousfreight.com`

## DNS cutover

- [ ] Apex redirects to `www`
- [ ] `www` points to Vercel
- [ ] `api` points to Render API
- [ ] `hooks` points to Render API
- [ ] Proxy/WAF enabled in Cloudflare for public hostnames

## Security checks

- [ ] Cloudflare rate limits enabled on auth and webhook paths
- [ ] Production secrets are not stored in Git
- [ ] JWT keys are loaded only from secret stores
- [ ] Stripe live keys are present only in production secret stores

## Decommission steps

- [ ] Netlify production site removed from active DNS
- [ ] Legacy Fly or mixed deploy references removed from operational docs
- [ ] Team runbooks updated to the new stack
