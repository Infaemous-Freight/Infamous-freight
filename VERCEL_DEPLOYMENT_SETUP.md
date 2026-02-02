# Vercel Deployment Setup Guide

## ✅ Code Changes Complete

All required code changes have been applied to the repository:

1. ✅ **Root package.json** - Updated `packageManager` to `pnpm@9.15.0` and `engines.node` to `20.x`
2. ✅ **Root .npmrc** - Already contains `engine-strict=true`
3. ✅ **apps/web/package.json** - Contains Next.js ^16.1.6, React ^19.2.4, and React-DOM ^19.2.4
4. ✅ **Health endpoint** - Created at `/apps/web/pages/api/health.ts`
5. ✅ **.vercelignore** - Verified no critical files are excluded

---

## 🔧 Vercel Dashboard Configuration

You must configure the following settings in your Vercel project dashboard:

### Step 1: General Settings

Navigate to: **Project Settings → General**

- **Root Directory**: `apps/web`
  - This is critical for Next.js detection to work correctly

### Step 2: Build & Development Settings

Navigate to: **Project Settings → Build & Development Settings**

#### Install Command

```bash
cd ../.. && corepack enable && pnpm -w install --frozen-lockfile
```

#### Build Command

```bash
cd ../.. && pnpm -w --filter web build
```

#### Output Directory

```
apps/web/.next
```

#### Framework Preset

- Should auto-detect as **Next.js** once Root Directory is set

### Step 3: Environment Variables

Navigate to: **Project Settings → Environment Variables**

Add these variables for **Production** and **Preview** environments:

| Name                            | Value                     | Source                  |
| ------------------------------- | ------------------------- | ----------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL | From Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key    | From Supabase dashboard |

⚠️ **IMPORTANT**: Do NOT add `SUPABASE_SERVICE_ROLE_KEY` to public environment variables!

---

## 🚀 Deployment Steps

### 1. Commit and Push Changes

```bash
git add .
git commit -m "fix: Configure Vercel deployment with pnpm 9.15.0 and Node 20"
git push origin main
```

### 2. Configure Vercel Settings

- Apply all settings from the "Vercel Dashboard Configuration" section above

### 3. Clear Cache and Redeploy

- In Vercel dashboard, trigger a new deployment
- Select **"Redeploy"** → **"Clear cache and redeploy"**
- This removes stale pnpm/Next detection artifacts

### 4. Verify Deployment

After deployment completes, test:

- ✅ Site loads successfully
- ✅ Health check endpoint: `https://your-domain.vercel.app/api/health`
  - Should return `200` status
  - Should show `ok: true`
  - Should show both Supabase flags as `true`

---

## 🔍 Expected Success Criteria

### Build Log Should Show

```
✓ Detected Next.js version
✓ Using pnpm 9.15.0
✓ Node.js version: 20.x
✓ Build completed successfully
```

### Health Endpoint Response

```json
{
  "ok": true,
  "node": "v20.x.x",
  "supabaseUrlPresent": true,
  "supabaseAnonPresent": true
}
```

---

## 🐛 Troubleshooting

### "No Next.js version detected"

1. Verify **Root Directory** is set to `apps/web` in Vercel settings
2. Confirm `apps/web/package.json` contains `next` dependency
3. Clear Vercel build cache and redeploy

### "pnpm not found"

1. Verify Install Command includes `corepack enable`
2. Confirm root `package.json` has `packageManager: "pnpm@9.15.0"`
3. Check `.npmrc` contains `engine-strict=true`

### Build fails with lockfile errors

1. Ensure Install Command includes `--frozen-lockfile` flag
2. Verify `pnpm-lock.yaml` is not in `.vercelignore`
3. Run `pnpm install` locally and commit updated lockfile

### Health endpoint returns 500

1. Check Environment Variables are set in Vercel dashboard
2. Verify variables are applied to correct environment (Production/Preview)
3. Redeploy to pick up new environment variables

### Workspace filter not working

1. Confirm package name in `apps/web/package.json` is exactly `"web"`
2. If different, update Build Command to use correct package name
3. Alternatively, use `cd ../.. && pnpm -w build` to build all workspaces

---

## 📚 Related Documentation

- [Next.js Vercel Deployment](https://nextjs.org/docs/deployment)
- [Vercel Monorepo Guide](https://vercel.com/docs/concepts/monorepos)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

## 🎯 Quick Reference Card

**Copy this to your Vercel project:**

| Setting          | Value                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Root Directory   | `apps/web`                                                         |
| Install Command  | `cd ../.. && corepack enable && pnpm -w install --frozen-lockfile` |
| Build Command    | `cd ../.. && pnpm -w --filter web build`                           |
| Output Directory | `apps/web/.next`                                                   |
