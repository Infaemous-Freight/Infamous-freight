# Codex Prompt: Rebuild Infamous Freight Website

You are working in the `MrMiless44/Infamous-freight` repo.

## Goal
Build the Infamous Freight website into a clean, production-ready, mobile-first logistics site that renders correctly on Netlify and matches these priorities:
- fast loading
- professional visual design
- strong mobile responsiveness
- reliable Next.js + Netlify deployment
- no blank/unstyled pages
- clear routing between marketing pages, login, dashboard, driver workflow, and status pages

## Context
- Netlify build config is already correct and must be preserved:
  - base: `.`
  - build: `pnpm install --frozen-lockfile && pnpm --filter web build`
  - publish: `apps/web/.next`
  - functions: `apps/web/.netlify/functions`
  - plugin: `@netlify/plugin-nextjs`
- Repo currently uses Next.js with both App Router and Pages Router patterns.
- Global CSS imports already exist, so focus on consistent styling and route rendering, not guessing missing CSS imports.
- Firebase frontend config is connected.
- Supabase frontend config is connected.
- The main website must render correctly at `https://www.infamousfreight.com`.

## What I want you to do
1. Audit the current frontend architecture in `apps/web`.
2. Identify the actual entry routes for:
   - homepage
   - status page
   - dashboard
   - dashboard health page
   - login
   - driver
3. Make the marketing homepage the clear primary landing page with:
   - premium freight/logistics branding
   - strong hero section
   - services grid
   - shipment tracking section
   - quote CTA
   - operations/customer portal links
   - polished mobile layout
4. Standardize styling so the live site looks consistent across App Router and Pages Router routes.
5. Eliminate any route rendering that appears raw/plain/unstyled on production.
6. Ensure the site degrades safely:
   - if auth/data fails, show a visible error state instead of hanging forever
   - do not leave pages stuck on “Loading...” indefinitely
7. Improve `/dashboard` behavior:
   - if user is not authenticated, redirect clearly to login
   - if Firebase/Firestore fails, surface a readable error state
   - do not silently stall
8. Improve `/status` and `/dashboard-health` so they are useful diagnostics pages for production.
9. Keep env var usage canonical:
   - frontend Supabase should use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - do not reintroduce duplicate Supabase URL vars
10. Preserve Netlify compatibility and do not change working build settings unless absolutely necessary.

## Implementation requirements
- Prefer the simplest robust architecture.
- Minimize duplicate layouts and duplicate style systems.
- If App Router is the main path, make it the primary source of truth for the marketing/public experience.
- Keep code production-grade and readable.
- Avoid hacks that only hide the problem.
- Add clear runtime error handling where needed.
- Keep mobile-first spacing, typography, and CTA hierarchy strong.

## Deliverables
- update the necessary frontend files
- explain the root causes you found
- summarize exactly what was changed
- list any remaining blockers
- include any commands needed to verify locally

## Verification checklist
- homepage renders styled and correctly on mobile
- `/status` works
- `/dashboard-health` works
- `/login` works
- `/driver` works
- `/dashboard` does not hang forever
- Netlify production build still works using:
  `pnpm install --frozen-lockfile && pnpm --filter web build`

Start by inspecting the current `apps/web` route structure and styling setup, then implement the best production-ready version without asking me unnecessary clarification questions.
