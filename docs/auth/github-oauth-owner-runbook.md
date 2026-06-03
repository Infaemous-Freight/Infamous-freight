# GitHub OAuth Owner Runbook

This runbook captures the remaining GitHub OAuth setup that requires the GitHub account owner and production auth-provider owner. It intentionally stores only public configuration values and process steps. Do not paste generated OAuth client secrets into issues, PRs, logs, screenshots, or chat.

## Scope

- GitHub OAuth app creation for Infæmous Freight sign-in.
- Current production enablement through Netlify Identity, which is the active frontend auth path.
- Supabase Auth GitHub provider setup only if/when the platform intentionally cuts back to Supabase Auth.
- Post-configuration validation that can be run without revealing secrets.

## Current repo-backed auth path

The active web login page uses `@netlify/identity` for email/password and OAuth sign-in. GitHub OAuth appears in the UI only when the deployed Netlify Identity settings report `github` as an enabled external provider. Supabase Auth provider configuration is therefore an owner-only future/cutover task unless the frontend auth implementation changes.

## Required owner access

| System | Required role | Why automation cannot complete it |
| --- | --- | --- |
| GitHub account developer settings | GitHub account owner | Only the owner can create the OAuth app and view the generated client secret. |
| Netlify production site | Site owner/admin | Netlify Identity external provider settings require dashboard access and the generated GitHub client secret. |
| Supabase project `wnaievjffghrztjuvutp` | Supabase project owner/admin, only for a Supabase Auth cutover | Supabase provider settings require dashboard access and the generated GitHub client secret. |

## Public configuration values

### Current Netlify Identity setup

| Field | Value |
| --- | --- |
| Application name | `Infæmous Freight` |
| Homepage URL | `https://www.infamousfreight.com` |
| Authorization callback URL | Use the callback URL shown in Netlify → Identity → Registration → External providers → GitHub. Confirm it is for the production `infamousfreight.com` site before saving the GitHub OAuth app. |
| Production site URL | `https://www.infamousfreight.com` |

### Supabase Auth cutover setup

Use these values only if the active auth provider is intentionally changed back to Supabase Auth:

| Field | Value |
| --- | --- |
| Application name | `Infæmous Freight` |
| Homepage URL | `https://www.infamousfreight.com` |
| Supabase project ref | `wnaievjffghrztjuvutp` |
| GitHub OAuth authorization callback URL | `https://wnaievjffghrztjuvutp.supabase.co/auth/v1/callback` |
| Production site URL | `https://www.infamousfreight.com` |

## Owner steps: current Netlify Identity provider

### 1. Create the GitHub OAuth app

1. Open Netlify → Sites → production Infæmous Freight site → **Identity** → **Registration** → **External providers** → **GitHub**.
2. Copy the callback URL Netlify shows for the production site.
3. Open GitHub Developer Settings → OAuth Apps: <https://github.com/settings/developers>
4. Select **New OAuth App**.
5. Enter:
   - **Application name:** `Infæmous Freight`
   - **Homepage URL:** `https://www.infamousfreight.com`
   - **Authorization callback URL:** the production Netlify Identity callback URL copied in step 2.
6. Create the app.
7. Copy the generated **Client ID**.
8. Generate/copy the **Client Secret** and keep it in the owner password manager only.

### 2. Enable GitHub in Netlify Identity

1. Return to Netlify → production site → **Identity** → **Registration** → **External providers** → **GitHub**.
2. Enable GitHub.
3. Paste the GitHub OAuth **Client ID**.
4. Paste the GitHub OAuth **Client Secret**.
5. Save.
6. Confirm GitHub appears as enabled in the Netlify Identity provider list.

## Optional owner steps: Supabase Auth cutover

Do not perform these steps unless the frontend auth implementation has been changed back to Supabase Auth and the cutover is approved.

### 1. Create or update a GitHub OAuth app for Supabase

1. Open GitHub Developer Settings → OAuth Apps: <https://github.com/settings/developers>
2. Create or update an OAuth app with:
   - **Application name:** `Infæmous Freight`
   - **Homepage URL:** `https://www.infamousfreight.com`
   - **Authorization callback URL:** `https://wnaievjffghrztjuvutp.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret** to the owner password manager.

### 2. Enable GitHub in Supabase Auth

1. Open the Supabase dashboard for project `wnaievjffghrztjuvutp`.
2. Go to **Authentication → Providers → GitHub**.
3. Enable GitHub.
4. Paste the GitHub OAuth **Client ID**.
5. Paste the GitHub OAuth **Client Secret**.
6. Save.

### 3. Configure Supabase auth URLs

1. In Supabase, go to **Authentication → URL Configuration**.
2. Set **Site URL** to:

   ```text
   https://www.infamousfreight.com
   ```

3. Add these redirect URLs:

   ```text
   https://www.infamousfreight.com/auth/callback
   https://main.infamousfreight.com/auth/callback
   http://localhost:5173/auth/callback
   ```

4. Save.

## Verification after owner configuration

Run these checks from an operator workstation. They should not print secret values.

```bash
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run build
curl -i https://infamous-freight-api.fly.dev/api/health/live
```

Manual browser smoke test for the current Netlify Identity path:

1. Open `https://www.infamousfreight.com` in a private browser session.
2. Start the GitHub sign-in flow.
3. Confirm GitHub redirects back through Netlify Identity and then returns to the app.
4. Confirm the app reaches the expected authenticated landing page for the test account.
5. Sign out and confirm the public landing page still loads.

Manual browser smoke test for a future Supabase Auth cutover:

1. Open `https://www.infamousfreight.com` in a private browser session.
2. Start the GitHub sign-in flow.
3. Confirm GitHub redirects to Supabase and then back to `https://www.infamousfreight.com/auth/callback`.
4. Confirm the app reaches the expected authenticated landing page for the test account.

## Risk check

- Never commit the GitHub OAuth client secret.
- Never add the client secret to `VITE_*`, `PUBLIC_*`, or browser-visible environment variables.
- Keep Supabase browser configuration limited to `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if Supabase Auth is reintroduced.
- If the secret is exposed, regenerate it in GitHub, update the active auth provider dashboard, and retest the browser sign-in flow.
- If sign-in loops or fails after redirect, verify exact URL spelling, including scheme, host, and callback path.

## Fallback

If GitHub OAuth cannot be enabled before launch, leave the provider disabled and continue using the existing supported email/password auth path. Do not weaken tenant, role, RLS, or JWT validation to force OAuth through.
