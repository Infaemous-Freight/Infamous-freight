# 📱 Railway Deployment Guide (iPhone-Friendly)

## Step 1: Visit Railway Website

Open Safari on your iPhone and go to:
**<https://railway.app>**

## Step 2: Sign In with GitHub

1. Tap **"Start a New Project"** or **"Login"**
2. Choose **"Login with GitHub"**
3. Authorize Railway to access your GitHub account (MrMiless44)

## Step 3: Create New Project

1. On Railway dashboard, tap **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: **`MrMiless44/Infamous-freight-enterprises`**
4. Railway will detect the monorepo automatically

## Step 4: Configure Service

1. Railway creates a service - tap on it
2. Go to **Settings** tab
3. Set **Root Directory**: `apps/api`
4. Set **Build Command**: `pnpm install && pnpm build`
5. Set **Start Command**: `node src/server.js`

## Step 5: Add PostgreSQL Database

1. Tap **"+ New"** button
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will provision database automatically
4. Database URL will be auto-injected as `DATABASE_URL`

## Step 6: Set Environment Variables

Tap **"Variables"** tab and add these:

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-now
CORS_ORIGINS=https://infamousfreight.vercel.app
AI_PROVIDER=synthetic
LOG_LEVEL=info
```

**Important:** Change `JWT_SECRET` to a strong random string!

## Step 7: Deploy

1. Tap **"Deploy"** button at the top
2. Wait 2-3 minutes for deployment
3. Railway will build and start your API

## Step 8: Get Your API URL

1. Go to **Settings** tab
2. Find **"Domains"** section
3. Tap **"Generate Domain"**
4. Copy your Railway URL (e.g., `your-app.railway.app`)

## Step 9: Test API

Open your Railway URL in Safari:

```
https://your-app.railway.app/api/health
```

Should see:

```json
{
  "uptime": 123,
  "timestamp": 1234567890,
  "status": "ok",
  "database": "connected"
}
```

## Step 10: Update Frontend

Your Vercel frontend needs the new API URL:

1. Go to <https://vercel.com/dashboard>
2. Select **"infamous-freight-enterprises"** project
3. Go to **Settings** → **Environment Variables**
4. Add: `NEXT_PUBLIC_API_URL` = `https://your-app.railway.app`
5. Redeploy frontend (automatic on next git push)

---

## 🎉 Done

Your full stack is now live:

- ✅ Frontend: <https://infamousfreight.vercel.app>
- ✅ Backend: <https://your-app.railway.app>
- ✅ Database: PostgreSQL on Railway

---

## Troubleshooting

**If deployment fails:**

1. Check **"Deployments"** tab for logs
2. Common issues:
   - Build timeout: Increase in Settings
   - Missing env vars: Add in Variables tab
   - Wrong root directory: Should be `apps/api`

**If health check fails:**

1. Check DATABASE_URL is set
2. Verify Prisma migrations ran
3. Check deployment logs for errors

**Need help?**

- Railway Discord: <https://discord.gg/railway>
- Railway Docs: <https://docs.railway.app>

---

## Cost Estimate

Railway free tier includes:

- **$5/month free credit**
- **500 hours/month** (enough for 1 service 24/7)
- **PostgreSQL included** in free tier
- **Auto-scaling** (pay only for usage)

Typical costs after free tier:

- **API + Database**: ~$5-10/month for low traffic
- **Production traffic**: ~$20-50/month
