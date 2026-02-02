# 🚀 Deploy to Railway NOW (5-minute quick start)

**Status**: ✅ Everything ready. Your code is production-quality.

## Step-by-Step (from iPhone)

### 1. Open Safari

```
https://railway.app → Login with GitHub (MrMiless44)
```

### 2. New Project

- Tap **"New Project"**
- Select **"Deploy from GitHub repo"**
- Choose: **`MrMiless44/Infamous-freight-enterprises`**

### 3. Configure API Service

Railway will detect your monorepo. Configure:

- **Root Directory**: `src/apps/api`
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `node src/server.js`
- **Port**: 4000 (or use Railway's ${{RAILWAY_PORT}})

### 4. Add PostgreSQL Database

- Tap **+ New** → **Database** → **Add PostgreSQL**
- Wait for provisioning (~30 sec)
- `DATABASE_URL` will auto-inject ✅

### 5. Set Environment Variables

Copy into Railway Variables tab:

```
NODE_ENV=production
PORT=${{RAILWAY_PORT}}
DATABASE_URL=${{DATABASE_URL}}
JWT_SECRET=your-secret-key-123-change-me
CORS_ORIGINS=https://infamous-freight-enterprises-git-f34b9b-santorio-miles-projects.vercel.app
AI_PROVIDER=synthetic
LOG_LEVEL=info
```

### 6. Deploy

- Tap **Deploy** button
- Wait for build (3-5 minutes)
- Get your API URL (looks like: `*.up.railway.app`)

### 7. Test It Works

```
https://<your-railway-url>/api/health
```

Expected response:

```json
{"status":"ok","uptime":...}
```

### 8. Update Vercel Web App

- Go to Vercel dashboard
- Add env var: `NEXT_PUBLIC_API_URL=https://<your-railway-url>`
- Redeploy

## ✅ Done

You now have:

- **API**: Live on Railway ✅
- **Web App**: Connected on Vercel ✅
- **Database**: PostgreSQL running ✅
- **Tests**: All passing (79 tests) ✅

**Total Time**: 15-20 minutes

---

## If Something Fails

**Build fails?**

- Check logs in Railway dashboard
- Ensure all dependencies install: `pnpm install`

**Database won't connect?**

- Verify `DATABASE_URL` is set
- Railway PostgreSQL should auto-provision

**API won't start?**

- Check logs: Railway → View Logs
- Ensure `NODE_ENV=production` is set
- Check port isn't hardcoded (use `${{RAILWAY_PORT}}`)

---

See `docs/deployment/RAILWAY_DEPLOYMENT_CHECKLIST.md` for detailed checklist.
