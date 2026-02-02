# 🚂 Railway Manual Deployment Guide (5 Minutes)

**Since Railway CLI has environment limitations in Codespace, deploy via Railway web UI instead - takes only 5 minutes!**

---

## ⚡ Quick Deploy (Do This Now!)

### Step 1: Go to Railway Dashboard
**URL**: https://railway.app/dashboard

Click **"New Project"**

---

### Step 2: Deploy from GitHub
1. Click **"Deploy from GitHub"**
2. Authorize Railway with your GitHub account if prompted
3. Select repo: **`MrMiless44/Infamous-freight`**
4. Confirm deployment options

---

### Step 3: Configure API Service

Railway will auto-detect your repo and show deployment options.

**Select**:
- **Dockerfile**: `Dockerfile.api`
- **Service Name**: `infamous-freight-api`
- **Port**: `3001`

---

### Step 4: Set Environment Variables

Click **"Add Variable"** and paste these values:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `API_PORT` | `3001` |
| `JWT_SECRET` | `ZYBpTP8D2oMg78DUZfmkVbNol2z5P9xRhrjSdSEkS5s=` |
| `DB_PASSWORD` | `yChsWR2m1HKfAIVtsrWF` |
| `CORS_ORIGINS` | `https://infamous-freight-enterprises.vercel.app` |
| `AI_PROVIDER` | `synthetic` |
| `LOG_LEVEL` | `info` |
| `SENTRY_DSN` | `https://examplePublicKey@o0.ingest.sentry.io/0` (or leave blank) |

**✅ Environment variables set!**

---

### Step 5: Add PostgreSQL Database

1. In Railway project, click **"⊕ Add"** (plus icon)
2. Select **"PostgreSQL"**
3. Wait for database to provision (1-2 minutes)
4. Railway auto-adds `DATABASE_URL` to environment

**✅ Database added!**

---

### Step 6: Deploy!

1. Click **"Deploy"** button
2. Watch the deployment logs scroll by
3. Wait for ✅ **"Success"** message
4. Deployment takes 5-10 minutes

---

### Step 7: Get Your API URL

Once deployed:
1. Click on the API service in Railway
2. Go to **"Settings"**
3. Find **"Public URL"** or **"Railway Domain"**
4. Copy the URL (looks like: `https://infamous-freight-api.railway.app`)

**Example**: 
```
https://infamous-freight-api.railway.app
```

---

### Step 8: Test API Health

```bash
# Replace with your actual URL
curl https://your-railway-api-url/api/health

# Expected response:
# {"status":"ok","database":"connected"}
```

---

### Step 9: Update Vercel Environment

1. Go to: https://vercel.com/dashboard
2. Select your project: **"Infamous Freight"**
3. Go to **"Settings"** → **"Environment Variables"**
4. Find or create: **`NEXT_PUBLIC_API_URL`**
5. Set value to your Railway URL:
   ```
   https://your-railway-api-url
   ```
6. Click **"Save"**
7. Go to **"Deployments"** and click **"Redeploy"** on latest commit

**✅ Vercel updated!**

---

### Step 10: Verify End-to-End

1. Open web app: https://infamous-freight-enterprises.vercel.app
2. You should see the login page
3. Try to log in (check browser console for CORS errors - should be none)
4. Check Sentry: https://sentry.io (confirm events arriving)

---

## 🎉 You're Live!

**Deployment Status**:
- ✅ API: Running on Railway
- ✅ Database: PostgreSQL connected
- ✅ Web: Deployed on Vercel
- ✅ Monitoring: Sentry active

**URLs**:
- **Web App**: https://infamous-freight-enterprises.vercel.app
- **API Health**: https://your-railway-api-url/api/health
- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 🔧 Troubleshooting

### API returns 502 error
- Check Railway logs: Railway Dashboard → Right-click service → View Logs
- Ensure DATABASE_URL is set correctly
- Check that port is 3001

### CORS errors in browser
- Verify `CORS_ORIGINS` in Railway environment includes your Vercel domain
- Redeploy Vercel after Railway URL is set
- Clear browser cache (Cmd+Shift+Delete)

### Database not connecting
- In Railway, check PostgreSQL service is healthy (green status)
- Verify `DATABASE_URL` environment variable exists
- Check logs for connection errors

### Can't login
- Check browser DevTools → Network tab
- Verify API endpoint is correct in Vercel environment
- Check Sentry for backend errors

---

## 📊 Post-Deployment Checklist

- [ ] API health check passed (returns `{"status":"ok","database":"connected"}`)
- [ ] Web app loads (https://infamous-freight-enterprises.vercel.app)
- [ ] No CORS errors in browser console
- [ ] Login page accessible
- [ ] Railway shows successful deployment (green checkmark)
- [ ] PostgreSQL database connected
- [ ] Sentry receiving events

---

## 📞 Support

**Need help?**
1. Check [DEPLOYMENT_100_GUIDE.md](DEPLOYMENT_100_GUIDE.md) - complete troubleshooting
2. View Railway logs: Railway Dashboard → Logs
3. Check Vercel logs: Vercel Dashboard → Deployments → Logs
4. View application logs: Sentry → Issues

---

**Next**: Follow the 10 steps above → 5 minutes → 100% LIVE! 🚀

