# Infamous Freight — Integrations & Secrets Inventory

Centralized reference for every external service and CI/CD secret used by this
repository.  Update this document whenever a new integration is added or a
secret is rotated.

---

## 1. External Integrations

| Service | Category | Runtime Purpose | Owner | Docs |
|---------|----------|-----------------|-------|------|
| **Fly.io** | Hosting | Runs the Node/Express API container in production | Platform team | https://fly.io/docs |
| **Netlify** | Hosting | Builds and serves the React web app in production via native Git integration | Platform team | https://docs.netlify.com |
| **GitHub Container Registry (GHCR)** | Container registry | Stores tagged API Docker images produced by the `build-api` CI job | Platform team | https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry |
| **Sentry** | Observability | Captures runtime errors and uploads source-maps during web builds | Platform team | https://docs.sentry.io |
| **Stripe** | Payments | Processes freight invoices and carrier pay-outs; web SDK loaded at runtime | Payments team | https://stripe.com/docs |
| **Supabase** | Auth + Database | Provides user auth (JWT) and the PostgreSQL database via the Supabase client SDK | Platform team | https://supabase.com/docs |
| **Socket.IO** | Real-time | Pushes live shipment-status updates from the API to the web client | Platform team | https://socket.io/docs |
| **Netlify plugins** | Build tooling | Optional Netlify build plugins (e.g. `netlify.toml`) used for edge configuration and redirects | Platform team | https://docs.netlify.com/configure-builds/build-plugins |

---

## 2. Secrets Inventory

All secrets are stored as **GitHub Actions repository secrets** at
`https://github.com/Infaemous-Freight/Infamous-freight/settings/secrets/actions`
unless otherwise noted.

### 2.1 Workflow secrets (referenced in `ci-cd.yml`)

| Secret | Owner | Storage | Jobs that use it | Purpose |
|--------|-------|---------|------------------|---------|
| `GITHUB_TOKEN` | GitHub (auto-provisioned) | GitHub Actions (built-in) | `build-api` (GHCR push) | Authenticates Docker pushes to GitHub Container Registry; never needs to be set manually |
| `FLY_API_TOKEN` | Platform team | GitHub Actions repo secret | `deploy-api` | Authorises `flyctl deploy` to push the API container to Fly.io |
| `VITE_API_URL` | Platform team | GitHub Actions repo secret | _(unused in CI; set in Netlify environment)_ | Sets the production API base URL used by the React app |
| `VITE_STRIPE_PUBLIC_KEY` | Payments team | GitHub Actions repo secret | _(unused in CI; set in Netlify environment)_ | Used by `@stripe/stripe-js` to initialise the Stripe payment element |
| `SENTRY_AUTH_TOKEN` | Platform team | GitHub Actions repo secret | _(follow-up: API source-maps)_ | Allows Sentry tooling to upload source-maps and create releases in Sentry |
| `SENTRY_ORG` | Platform team | GitHub Actions repo secret | _(follow-up)_ | Sentry organization slug (e.g. `infamous`) |
| `SENTRY_PROJECT` | Platform team | GitHub Actions repo secret | _(follow-up)_ | Sentry project slug (e.g. `infamous-freight`) |

### 2.2 Runtime secrets (application layer, not in `ci-cd.yml`)

These are used at application runtime and should be set as Fly.io app secrets
(`fly secrets set`) and/or as Supabase environment variables.  They are listed
here for ownership awareness.

| Secret | Owner | Notes |
|--------|-------|-------|
| `DATABASE_URL` | Platform team | Postgres connection string; set on the Fly.io app |
| `SUPABASE_URL` | Platform team | Project URL from Supabase Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Platform team | `service_role` key; grants admin DB access — treat as critical |
| `STRIPE_SECRET_KEY` | Payments team | Server-side Stripe API key; used by the API for charge creation |
| `STRIPE_WEBHOOK_SECRET` | Payments team | Verifies Stripe webhook signatures on the API |
| `JWT_SECRET` | Platform team | Signs session tokens issued by the API |

---

## 3. Runbooks

### 3.1 Deploy failure — API (Fly.io)

**Symptom:** The `deploy-api` job fails or the API is unreachable at
`https://api.infamousfreight.com/health`.

**Steps:**

1. Open the failed workflow run in GitHub Actions and expand the
   `Deploy API to Fly.io` step to read the `flyctl` error output.

2. **Auth error (`unauthenticated` / `401`):**
   ```
   Error: failed to fetch an app: 401
   ```
   Rotate `FLY_API_TOKEN` (see §3.3) and re-run the workflow.

3. **No machines / capacity error:** Log in to the Fly.io dashboard and check
   the `infamous-freight` app health.  Scale or restart:
   ```bash
   fly status --app infamous-freight
   fly machines restart --app infamous-freight
   ```

4. **Build failed before deploy:** The `build-api` job must succeed before
   `deploy-api` runs.  Fix the build error first, then re-push to `main`.

5. **Manual deploy:**
   ```bash
   fly auth login
   flyctl deploy --remote-only --app infamous-freight
   ```

6. **Rollback to last good release:**
   ```bash
   fly releases --app infamous-freight   # find the last good version
   IMAGE=<previous-image-tag>
   flyctl deploy --image "$IMAGE" --app infamous-freight

   # Example format for a known-good image:
   # IMAGE=registry.fly.io/infamous-freight:deployment-<release-id>
   ```

---

### 3.2 Deploy failure — Web (Netlify)

**Symptom:** The web app is unreachable at `https://www.infamousfreight.com`.

Web deploys are handled automatically by **Netlify's native Git integration** on
push to `main`.  GitHub Actions does not deploy the web app.

**Steps:**

1. Open the Netlify dashboard → Sites → `infamous-freight` → Deploys and review
   the failing build log.

2. **Build error (TypeScript / Vite):**
   Reproduce locally before investigating:
   ```bash
   VITE_API_URL=https://api.infamousfreight.com \
   VITE_STRIPE_PUBLIC_KEY=pk_live_... \
   npm run build:web
   ```

3. **Missing environment variable:**
   Add or correct the variable in Netlify → Site settings → Environment variables.

4. **Rollback to previous deployment:**
   In the Netlify dashboard, navigate to the site → Deploys → select the last
   successful build → Publish deploy.

---

### 3.3 Secret rotation

Rotate secrets immediately if they are exposed (e.g. committed to git, visible
in public logs) or on the schedule below.

| Secret | Rotation frequency | Steps |
|--------|--------------------|-------|
| `FLY_API_TOKEN` | On exposure / annually | 1. Log in to Fly.io → Personal Access Tokens → revoke old token, create new one. 2. Update GitHub Actions secret `FLY_API_TOKEN`. 3. Trigger a test deploy to confirm. |
| `SENTRY_AUTH_TOKEN` | On exposure | 1. Sentry → Settings → Auth Tokens → revoke, create new with `project:releases` scope. 2. Update `SENTRY_AUTH_TOKEN` in GitHub Actions. |
| `STRIPE_SECRET_KEY` | On exposure | 1. Stripe Dashboard → API Keys → roll key. 2. Update the Fly.io app secret (`fly secrets set STRIPE_SECRET_KEY=...`). 3. Verify webhook signing still works. |
| `STRIPE_WEBHOOK_SECRET` | On endpoint change / exposure | 1. Stripe Dashboard → Webhooks → regenerate signing secret. 2. Update `STRIPE_WEBHOOK_SECRET` on the Fly.io app. |
| `SUPABASE_SERVICE_KEY` | On exposure | 1. Supabase dashboard → Project Settings → API → regenerate `service_role` key. 2. Update all references (Fly.io secrets, any CI secrets). |
| `JWT_SECRET` | On exposure | 1. Generate a new random 256-bit secret. 2. Update on Fly.io: `fly secrets set JWT_SECRET=...`. **Note:** all active sessions will be invalidated — users must re-login. |

**How to update a GitHub Actions secret:**
```bash
gh secret set SECRET_NAME --body "new-value" \
  -R Infaemous-Freight/Infamous-freight
```

---

### 3.4 Service outage

#### Fly.io outage (API down)

1. Check status at https://status.fly.io.
2. If a regional outage, consider scaling to a different region:
   ```bash
   fly regions add iad --app infamous-freight   # e.g. us-east
   ```
3. Until restored, update the web app to show a maintenance banner or redirect
   to a static status page.

#### Netlify outage (Web down)

1. Check status at https://www.netlifystatus.com.
2. The last successful Netlify deploy remains live; Netlify serves from its CDN
   and typically maintains the previous build during a partial outage.
3. For a full outage, the built `apps/web/dist` can be served temporarily from
   a CDN or another static host.

#### Stripe outage (Payments unavailable)

1. Check status at https://status.stripe.com.
2. Disable the payment flow in the app via a feature flag or a temporary
   maintenance message to prevent partial transactions.
3. Do not retry failed charges automatically until the outage is resolved.

#### Supabase outage (Auth / DB down)

1. Check status at https://status.supabase.com.
2. Auth-gated pages will fail — consider serving a read-only maintenance page.
3. Fly.io app logs will show DB connection errors; no action needed beyond
   waiting for restoration.
4. If the outage is prolonged, contact Supabase support with your project ref.

#### Sentry outage (Observability gap)

Sentry is non-critical for uptime.  Deploys continue without source-map
uploads.  Monitor https://status.sentry.io and resume normal operations once
resolved.

---

## 4. Adding a new integration

When a new external service is wired in:

1. Add a row to the **External Integrations** table in §1.
2. Add each new secret to the **Secrets Inventory** table in §2.
3. Document rotation steps in the **Secret rotation** table in §3.3.
4. Add the secret to the appropriate CI job in `.github/workflows/ci-cd.yml`.
