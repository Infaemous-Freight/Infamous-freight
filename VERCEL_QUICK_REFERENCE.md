# Vercel Deployment Quick Reference Card

## 🚀 Pre-Deployment Checklist

- [ ] Run verification script: `./scripts/verify-vercel-setup.sh`
- [ ] All tests passing: `pnpm test`
- [ ] Commit changes: `git add . && git commit -m "fix: Vercel deployment config"`
- [ ] Push to main: `git push origin main`

---

## ⚙️ Vercel Dashboard Settings (Copy/Paste Ready)

### General Settings → Root Directory

```
apps/web
```

### Build & Development Settings

**Install Command:**

```bash
cd ../.. && corepack enable && pnpm -w install --frozen-lockfile
```

**Build Command:**

```bash
cd ../.. && pnpm -w --filter web build
```

**Output Directory:**

```
apps/web/.next
```

**Framework Preset:**

```
Next.js (should auto-detect)
```

---

## 🔐 Environment Variables (Production + Preview)

Copy these variable names to Vercel dashboard:

| Variable Name                   | Get From                            | Required |
| ------------------------------- | ----------------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase Dashboard → Settings → API | ✅ Yes    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | ✅ Yes    |

### How to Get Supabase Values

1. Go to <https://supabase.com/dashboard>
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy **Project URL** and **anon (public) key**

⚠️ **NEVER** add `SUPABASE_SERVICE_ROLE_KEY` to Vercel env vars!

---

## 📋 Deployment Steps

1. **Configure Vercel Settings** (see above)
2. **Add Environment Variables** (see above)
3. **Deploy:**
   - Go to Vercel Dashboard → Deployments
   - Click **"Redeploy"** → **"Clear cache and redeploy"**
4. **Verify:**
   - Check deployment succeeds
   - Visit: `https://your-domain.vercel.app/api/health`
   - Should return: `{"ok":true,"node":"v20.x.x","supabaseUrlPresent":true,"supabaseAnonPresent":true}`

---

## ✅ Success Criteria

Build log shows:

- ✅ `Detected Next.js version`
- ✅ `Using pnpm 9.15.0`
- ✅ `Node.js version: 20.x`
- ✅ `Build completed successfully`

Health endpoint returns:

- ✅ HTTP 200 status
- ✅ `ok: true`
- ✅ Both Supabase flags `true`

---

## 🐛 Quick Troubleshooting

| Error                           | Fix                                                     |
| ------------------------------- | ------------------------------------------------------- |
| "No Next.js version detected"   | Set Root Directory to `apps/web`                        |
| "pnpm not found"                | Ensure Install Command has `corepack enable`            |
| "Lockfile mismatch"             | Use `--frozen-lockfile` flag                            |
| Health returns 500              | Check env vars in Vercel dashboard                      |
| Build fails at workspace filter | Verify package name is `web` in `apps/web/package.json` |

---

## 📞 Support Resources

- Full Guide: [VERCEL_DEPLOYMENT_SETUP.md](VERCEL_DEPLOYMENT_SETUP.md)
- Verification Script: `./scripts/verify-vercel-setup.sh`
- Supabase Docs: <https://supabase.com/docs/guides/getting-started/quickstarts/nextjs>
- Vercel Monorepo Guide: <https://vercel.com/docs/concepts/monorepos>

---

## 🎯 Configuration Snapshot

```json
{
  "packageManager": "pnpm@9.15.0",
  "engines": { "node": "20.x" },
  "vercel": {
    "rootDirectory": "apps/web",
    "installCommand": "cd ../.. && corepack enable && pnpm -w install --frozen-lockfile",
    "buildCommand": "cd ../.. && pnpm -w --filter web build",
    "outputDirectory": "apps/web/.next"
  }
}
```

---

**Last Updated:** February 2, 2026  
**Version:** 1.0.0
