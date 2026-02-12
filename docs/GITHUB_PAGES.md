# GitHub Pages Deployment

This repository includes automated GitHub Pages deployment that builds, validates, and deploys a static site.

## Workflow

The deployment is handled by `.github/workflows/deploy-pages.yml` which:

1. **Builds** the Next.js web app as a static export
2. **Validates** HTML using html-validate
3. **Audits** performance and SEO using Lighthouse CI
4. **Deploys** to GitHub Pages (on main branch only)

## Build Process

The build process is managed by `scripts/build-pages.mjs`:

1. Cleans the `dist/` directory
2. Builds the shared package (if needed)
3. Builds the Next.js web app with static export (`output: "export"`)
4. Copies the output from `apps/web/out/` to `./dist/`
5. Creates a `.nojekyll` file for GitHub Pages

## Configuration Files

- **`.lighthouserc.cjs`** - Lighthouse CI configuration
  - Collects from `./dist` directory
  - Runs 3 times per URL for accuracy
  - Warns on performance, accessibility, best-practices, and SEO scores

## Triggering Deployment

The workflow runs on:

- Push to `main` branch (deploys)
- Pull requests (builds and validates only, no deployment)

## Manual Testing

To test the build locally:

```bash
# Install dependencies
pnpm install

# Run the build
pnpm run build

# Check output
ls -la dist/
```

## Notes

- The workflow uses `|| true` for HTML validation and Lighthouse CI, allowing them to fail without blocking deployment
- The Next.js app is configured to use `output: "export"` when `GITHUB_PAGES_BUILD=true`
- Static export disables API routes and middleware (as expected for static hosting)
- In a GitHub Pages deployment, the web app communicates with the backend via direct HTTP(S) calls to the production API, using the configured `API_URL` (as consumed by `useApi.ts`)
- Ensure that `API_URL` is set to an absolute URL for the production API and that the API is configured with CORS to allow requests from the GitHub Pages origin
