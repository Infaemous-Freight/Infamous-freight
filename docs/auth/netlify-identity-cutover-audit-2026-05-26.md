# Netlify Identity Cutover Audit (2026-05-26)

## Root cause
A legacy Supabase web auth hook/client remained in the repository after Netlify Identity became the active frontend auth path. This created migration ambiguity and unnecessary CSP allowlist entries.

## Supabase auth callsite inventory
`rg -n "useSupabaseAuth|supabase\.auth|createBrowserClient|createServerClient|@supabase" apps/web/src` now returns no results.

## Active frontend auth callsites
- `apps/web/src/layouts/AppLayout.tsx`: session hydration + auth-change listener via `hydrateNetlifyIdentityUser` / `onAuthChange`.
- `apps/web/src/pages/LoginPage.tsx`: login/signup/oauth via `@netlify/identity`.
- `apps/web/src/components/ui/Sidebar.tsx`: logout via `logoutNetlifyIdentity`.

## Supabase migrations
`supabase/migrations/` remains intentionally unchanged because those SQL files represent database hardening history and are not browser auth clients.

## CSP status
Primary site CSP in `netlify.toml` no longer allows `https://*.supabase.co` or `wss://*.supabase.co`.
