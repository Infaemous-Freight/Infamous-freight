# Netlify Environment Audit for `apps/web`

This checklist is specific to the current Infamous Freight monorepo and is based on the variables referenced by `apps/web` and the API/auth/billing integrations it talks to.

## What the web app actually expects

### Required for the Netlify-hosted web build/runtime

These are the highest-priority variables to verify in Netlify for the `apps/web` site:

- `NEXT_PUBLIC_API_URL` - public browser-facing API base URL used throughout the frontend. Point this at the live API origin, not `localhost`.
- `NEXT_PUBLIC_APP_URL` - canonical public URL for the deployed web app.
- `NEXTAUTH_URL` - required if NextAuth flows are enabled.
- `NEXTAUTH_SECRET` - required for NextAuth session/token signing.
- `JWT_SECRET` - required by the web app's Stripe checkout route at `app/api/stripe/route.ts`.
- `STRIPE_SECRET_KEY` - required by the web app's server-side Stripe helpers.
- `STRIPE_WEBHOOK_SECRET` - required by the web app's webhook route.

### Required by the API/backend this frontend calls

If production is broken even though the Netlify deploy succeeds, the issue may be in the backend environment instead of the Netlify site. The API currently validates or uses these variables:

- `DATABASE_URL`
- `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` when `JWT_ALGORITHM=RS256` (the current API default)
- `JWT_SECRET` only when `JWT_ALGORITHM=HS256`
- `CORS_ORIGIN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Optional feature integrations such as `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`

## Important repo-specific corrections to a generic Netlify audit

A few common assumptions do **not** match this repository exactly:

1. `DATABASE_URL` is **not** a required Netlify variable for the frontend build by default.
   - It is required by the API.
   - If your Netlify site only hosts `apps/web`, missing `DATABASE_URL` usually breaks the backend, not the static/browser build itself.

2. `DIRECT_URL` is **not** currently referenced by the application code.
   - Do not add it unless your deployment pipeline or ORM migration workflow truly needs it.

3. `JWT_SECRET` may still matter even if `NEXTAUTH_SECRET` is set.
   - The web app has a server route that explicitly reads `JWT_SECRET` for Stripe checkout auth.

4. `JWT_SECRET` is **not always** the API's primary auth secret.
   - The API defaults to `JWT_ALGORITHM=RS256`, which means `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` are the real required credentials unless you deliberately switch to `HS256`.

5. `NEXT_PUBLIC_API_URL` is the most likely frontend misconfiguration.
   - Multiple frontend modules fall back to localhost defaults if this is missing or wrong, which can make a production deploy appear healthy while requests fail in the browser.

## Netlify verification order

1. Verify `NEXT_PUBLIC_API_URL` first.
   - It should target the live API base URL used by the browser.
   - It should not point at `localhost`, a retired preview deployment, or the wrong path prefix.

2. Verify the app URL values.
   - `NEXT_PUBLIC_APP_URL` should match the public site URL.
   - `NEXTAUTH_URL` should match the same production URL if NextAuth is in use.

3. Verify server-only web secrets.
   - `NEXTAUTH_SECRET`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

4. Rebuild after every environment change.
   - Netlify must rebuild the site for build-time values to affect the generated output.
   - Use **Clear cache and deploy site** if you suspect stale assets or dependencies.

5. Confirm the backend separately.
   - If the frontend is deployed but API requests fail, audit the API host's `DATABASE_URL`, JWT key material, CORS, Stripe, Twilio, and Firebase values.

## Quick production checklist

Use this short list before another production deploy:

- [ ] `NEXT_PUBLIC_API_URL` points at the correct live API
- [ ] `NEXT_PUBLIC_APP_URL` points at the correct live web origin
- [ ] `NEXTAUTH_URL` matches the production web origin
- [ ] `NEXTAUTH_SECRET` is set if NextAuth is enabled
- [ ] `JWT_SECRET` is set for the web Stripe route
- [ ] `STRIPE_SECRET_KEY` is set
- [ ] `STRIPE_WEBHOOK_SECRET` is set
- [ ] Netlify variables were added with the correct build/runtime scope
- [ ] A fresh Netlify rebuild was triggered after changing variables
- [ ] The backend deployment was audited separately for `DATABASE_URL`, JWT keys/secrets, and integration credentials
