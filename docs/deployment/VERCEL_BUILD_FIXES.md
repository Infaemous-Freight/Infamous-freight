# Vercel Build Fixes - December 13, 2025 (Updated)

## 🔧 Issues Fixed

### 1. **Husky Install Failure** ✅

**Problem**: Build failed with `sh: line 1: husky: command not found`

```
npm error code 127
npm error command sh -c husky install
```

**Root Cause**: The `prepare` script in `package.json` runs `husky install` during npm install, but in CI/CD environments (like Vercel), husky may not be available or needed.

**Solution**: Made the prepare script optional by adding `|| true`

```json
"prepare": "husky install || true"
```

**Impact**:

- Builds will complete successfully even if husky is unavailable
- Local development still benefits from pre-commit hooks
- No negative side effects

---

### 2. **Suboptimal Build Configuration** ✅

**Problem**: Vercel was using npm directly instead of pnpm

```json
"buildCommand": "cd web && npm install && npm run build"
```

**Issues**:

- Inconsistent with monorepo setup (pnpm workspaces)
- Didn't build shared package dependency
- Slower builds due to npm instead of pnpm

**Solution**: Updated to use pnpm with proper build order

```json
"buildCommand": "pnpm install && pnpm --filter @infamous-freight/shared build && pnpm --filter infamous-freight-web build"
```

**Benefits**:

- Uses pnpm workspace structure
- Builds shared package first
- Faster caching and installations
- Consistent with local development

---

### 3. **.vercelignore Improvements** ✅

**Problem**: Minimal ignore file, not excluding build artifacts and test files

**Solution**: Enhanced with comprehensive exclusions

- Dependencies: `node_modules`, `pnpm-lock.yaml.orig`
- Build outputs: `.next`, `dist`, `build`, `coverage`
- Development files: `.env.local`, `.git`, IDE configs
- Test files: `__tests__`, `*.test.*`, `junit.xml`
- Archives: `archive` directory

**Benefits**:

- Smaller deployment footprint
- Faster build times
- Better security (no dev env vars deployed)
- Cleaner deployments

---

## 📊 Build Performance Impact

### Before

```
Duration: ~90s (estimate)
- npm install: ~30s (npm slower than pnpm)
- Husky install attempt: fails, error handling
- Shared package not built (might cause issues)
- Large deployment bundle
```

### After

```
Expected Duration: ~45-60s
- pnpm install: ~15s (faster monorepo handling)
- Husky optional: ~1ms (succeeds or skips gracefully)
- Shared package built: ~10s (dependencies available)
- Smaller deployment bundle (better caching)
```

**Estimated Improvement**: 30-50% faster builds

---

## 🚀 Deployment Ready

### Next Deployment Will

1. ✅ Install dependencies with pnpm (fast & consistent)
2. ✅ Build shared package first (available for web)
3. ✅ Build web application (Next.js)
4. ✅ Handle husky gracefully (no errors)
5. ✅ Deploy optimized bundle

### Build Configuration

```json
{
  "version": 2,
  "buildCommand": "pnpm install && pnpm --filter @infamous-freight/shared build && pnpm --filter infamous-freight-web build",
  "installCommand": "pnpm install"
}
```

Note:

- In a monorepo, set Vercel Project "Root Directory" to `web` so Vercel detects Next.js correctly and serves `web/.next` automatically.
- You generally do not need to set `outputDirectory` for Next.js; Vercel auto-detects it.

---

## ✅ Commits Made

- `docs: add Vercel build fixes documentation`
- `fix: optimize Vercel build configuration`
- `fix: make husky install optional in prepare script`

Exact commit SHAs may differ from local; see the repository history for the latest IDs.

---

## 🧪 Testing the Fix

To verify locally:

```bash
# Simulate Vercel's npm behavior (which uses prepare script)
npm install

# Or rebuild
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

---

## 📋 Deployment Checklist

- [x] Husky install fixed
- [x] Build command optimized
- [x] Shared package builds before web
- [x] .vercelignore cleaned up
- [x] Commits pushed
- [x] **Next**: Trigger new Vercel deployment (from dashboard or by pushing)

To trigger deployment:

1. Push changes to `main` (any new commit)
2. Visit <https://vercel.com/dashboard>
3. Redeploy the project or wait for automatic deployment

---

## 🔍 Monitoring Next Build

Watch for:

- ✅ `npm install` completes without husky errors
- ✅ Build command executes all three steps
- ✅ `.next` folder created successfully
- ✅ Deployment completes in <2 minutes
- ✅ Web app accessible at deployment URL

---

**Status**: ✅ **Ready for Deployment**

All fixes are in place and committed. The next Vercel build should complete successfully.
