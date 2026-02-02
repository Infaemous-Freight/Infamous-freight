# Sentry Wizard Command Reference (Monorepo-Safe)

## ✅ Correct Command (Run from apps/web)

```bash
cd /workspaces/Infamous-freight-enterprises/apps/web
npx @sentry/wizard@latest -i nextjs --saas --org infamous-freight-enterprise --project javascript-nextjs
```

**Why from apps/web?**

- Wizard needs to detect Next.js project in current directory
- Will patch the correct `next.config.*` file
- Ensures monorepo structure is respected
- Avoids patching root-level configs by mistake

---

## 🚨 Wrong Command (Don't do this)

```bash
# ❌ From repo root - wizard can't find Next.js
cd /workspaces/Infamous-freight-enterprises
npx @sentry/wizard@latest -i nextjs --saas --org infamous-freight-enterprise --project javascript-nextjs
# Result: "Next.js project not found" or patches wrong files
```

---

## 📋 What the Wizard Does

When run correctly, it will:

1. ✅ Detect Next.js version (16.1.6 in your case)
2. ✅ Create `sentry.client.config.ts` (or update existing)
3. ✅ Create `sentry.server.config.ts` (or update existing)
4. ✅ Create `sentry.edge.config.ts` (if using edge runtime)
5. ✅ Update `next.config.mjs` with `withSentryConfig()` wrapper
6. ✅ Create `instrumentation.ts` (if not exists)
7. ✅ Add `@sentry/nextjs` to `package.json`
8. ✅ Prompt for DSN (or use from flags)

**Files it modifies:**

```
apps/web/
├── sentry.client.config.ts      (created/updated)
├── sentry.server.config.ts      (created/updated)
├── sentry.edge.config.ts        (created/updated)
├── instrumentation.ts           (created if missing)
├── next.config.mjs              (wrapped with Sentry)
└── package.json                 (adds @sentry/nextjs)
```

---

## 🎯 Post-Wizard Manual Fixes (Required)

The wizard **doesn't know** about your middleware, so you must manually:

### 1. Fix middleware matcher

```typescript
// apps/web/middleware.ts
export const config = {
  matcher: [
    // Add |monitoring to the exclusion list
    "/((?!_next/static|_next/image|favicon.ico|public|monitoring).*)",
    //                                                   ↑ ADD THIS
  ],
};
```

### 2. Enable tunnel route (if wizard left it undefined)

```javascript
// apps/web/next.config.mjs
export default withSentryConfig(nextConfig, {
  org: 'infamous-freight-enterprise',
  project: 'javascript-nextjs',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Change from undefined to '/monitoring'
  tunnelRoute: '/monitoring', // ← ADD THIS
  
  // ... rest of config
});
```

### 3. Add Vercel environment variables

See [SENTRY_VERCEL_DEPLOYMENT.md](./SENTRY_VERCEL_DEPLOYMENT.md) for complete list.

---

## 🧪 Testing After Wizard

```bash
# 1. Install dependencies
pnpm install

# 2. Build to verify Sentry wrapper works
pnpm --filter web build

# 3. Start dev server
pnpm --filter web dev

# 4. Test error tracking
# Visit: http://localhost:3000/debug-sentry
# Click any error button

# 5. Check Sentry dashboard
# Visit: https://sentry.io/organizations/infamous-freight-enterprise/issues/
```

---

## 🔄 If You Need to Re-Run Wizard

```bash
cd /workspaces/Infamous-freight-enterprises/apps/web

# Remove existing Sentry config files
rm -f sentry.*.config.ts sentry.*.config.js instrumentation.ts

# Run wizard again
npx @sentry/wizard@latest -i nextjs --saas --org infamous-freight-enterprise --project javascript-nextjs
```

**Note:** This will regenerate files but won't remove `@sentry/nextjs` from package.json.

---

## 🆘 Troubleshooting

### "Next.js project not found"

**Cause:** Running from wrong directory

**Fix:** Must run from `apps/web`, not repo root

```bash
cd /workspaces/Infamous-freight-enterprises/apps/web
# Then run wizard
```

---

### "Permission denied" or "EACCES"

**Cause:** npm/npx needs permissions

**Fix:** Use pnpm instead:

```bash
pnpm dlx @sentry/wizard@latest -i nextjs --saas --org infamous-freight-enterprise --project javascript-nextjs
```

---

### Wizard creates .js instead of .ts files

**Cause:** Wizard defaults to JS if TypeScript not detected

**Fix:** Rename files and add types:

```bash
mv sentry.client.config.js sentry.client.config.ts
mv sentry.server.config.js sentry.server.config.ts
# Add proper TypeScript syntax
```

Or ensure `tsconfig.json` exists before running wizard.

---

### Wizard updates wrong next.config file

**Cause:** Multiple `next.config.*` files in different locations

**Fix:** Remove unused configs first:

```bash
# Check for multiple configs
find . -name "next.config.*" -not -path "*/node_modules/*"

# Keep only apps/web/next.config.mjs
# Delete others or rename to .bak
```

---

## 📝 Alternative: Manual Setup (No Wizard)

If wizard fails, you can set up manually. All files already created:

```
✅ apps/web/sentry.client.config.ts
✅ apps/web/sentry.server.config.ts
✅ apps/web/sentry.edge.config.ts
✅ apps/web/instrumentation.ts
✅ apps/web/next.config.mjs (already wrapped)
```

Just need to:

```bash
# 1. Install package
pnpm --filter web add @sentry/nextjs

# 2. Configure env vars (see SENTRY_VERCEL_DEPLOYMENT.md)

# 3. Test build
pnpm --filter web build
```

---

## ✅ Verification Checklist

After running wizard:

- [ ] `@sentry/nextjs` added to `apps/web/package.json`
- [ ] `sentry.client.config.ts` exists in `apps/web/`
- [ ] `sentry.server.config.ts` exists in `apps/web/`
- [ ] `next.config.mjs` wrapped with `withSentryConfig()`
- [ ] `instrumentation.ts` exists and imports Sentry
- [ ] Middleware fixed to exclude `/monitoring`
- [ ] Tunnel route set to `/monitoring` in next.config
- [ ] Environment variables configured
- [ ] Build completes without errors
- [ ] Test errors appear in Sentry

---

**Status:** Ready to run wizard or verify manual setup ✅

**Next:** See [SENTRY_VERCEL_DEPLOYMENT.md](./SENTRY_VERCEL_DEPLOYMENT.md) for deployment steps.
