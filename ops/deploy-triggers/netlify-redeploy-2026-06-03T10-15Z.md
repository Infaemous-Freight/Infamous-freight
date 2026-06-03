# Netlify Redeploy Trigger

Created to force a fresh production deploy after adding `apps/web/netlify.toml`.

Required production artifact:

- Base directory: `apps/web`
- Build command: `pnpm run build:web`
- Publish directory: `dist`

The live site should serve built Vite assets such as `/assets/*.js`, not `/src/main.tsx`.
