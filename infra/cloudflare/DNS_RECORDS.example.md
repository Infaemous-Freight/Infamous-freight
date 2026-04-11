# Cloudflare DNS Records (Example)

Use these as the target records for the production cutover.

## Core records

- `@` -> redirect to `https://www.infamousfreight.com`
- `www` -> CNAME to the Vercel-assigned frontend target
- `api` -> CNAME to the Render API service hostname
- `hooks` -> CNAME to the same Render API service hostname
- `status` -> CNAME to your chosen status page provider

## Recommended edge controls

Apply Cloudflare WAF and rate limiting to:

- `/api/auth/*`
- `/api/webhooks/*`
- `/quote`
- `/track`

## Notes

- `hooks.infamousfreight.com` should terminate on the same API service as `api.infamousfreight.com`.
- Keep webhook traffic path-based in the application (`/api/webhooks/*`) and hostname-based at the edge.
- Only decommission the current Netlify production site after `www` and `api` are both verified on the new stack.
