# Pending Netlify Database migrations

Migration source of truth: `netlify/database/migrations/`.

Do not commit or maintain manual migration copies under `apps/web/.netlify/internal/db/migrations/`; that path is internal workspace state and can be regenerated.

These SQL files were moved out of `netlify/database/migrations` so Netlify deploy previews can build without provisioning a managed Database branch.

The production web deploy currently proxies API traffic to the Fly.io backend, and the Netlify Functions directory is disabled in `netlify.toml`. Move these files back to `netlify/database/migrations` only when the Netlify Database integration is intentionally re-enabled for the site.
