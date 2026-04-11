# Domain Constraint Record

## Constraint

`www.infamousfreight.com` must remain on Netlify.

## Operational consequence

Production architecture should be treated as:

- Netlify for the public website on `www.infamousfreight.com`
- separate backend hosting for `api.infamousfreight.com`
- same backend service or restricted ingress for `hooks.infamousfreight.com`

## Anti-pattern to avoid

Do not move `www.infamousfreight.com` to Vercel if that breaks your live domain control.

Use Vercel only if you later move the frontend to another subdomain or remove the Netlify domain dependency entirely.
