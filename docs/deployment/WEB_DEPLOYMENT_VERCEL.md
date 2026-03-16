# Web Frontend Deployment to Vercel

**Status**: 🚀 Ready for Deployment

---

## Prerequisites

- Vercel account linked to GitHub repository
- Web project connected to Vercel dashboard
- Live API running: <https://infamous-freight-api.fly.dev>

---

## Deployment Steps

### Step 1: Set Environment Variable in Vercel Dashboard

1. Go to: <https://vercel.com/dashboard>
2. Select your project: **Infamous-freight-enterprises**
3. Navigate to: **Settings → Environment Variables**
4. Add this variable:

```
Name:  NEXT_PUBLIC_API_BASE
Value: https://infamous-freight-api.fly.dev
```

1. Select environments: **Production, Preview, Development**
2. Click **Save**

### Step 2: Trigger Deployment

```bash
# Push to main branch (automatic deployment)
git push origin main
```

**Or manually redeploy:**

1. Go to Vercel dashboard
2. Click **Deployments**
3. Click the **3-dot menu** on latest deployment
4. Select **Redeploy**

### Step 3: Verify Deployment

Wait 2-3 minutes for build to complete:

1. Check deployment status: <https://vercel.com/dashboard/[project>]
2. View live deployment: Your Vercel domain (e.g.,
   <https://infamous-freight-web.vercel.app>)
3. Check browser console for any errors
4. Test an API call in the browser:

```javascript
fetch("https://infamous-freight-api.fly.dev/api/health")
  .then((r) => r.json())
  .then((d) => console.log(d));
```

---

## Environment Variables Reference

| Variable               | Value                                  | Location                    |
| ---------------------- | -------------------------------------- | --------------------------- |
| `NEXT_PUBLIC_API_BASE` | `https://infamous-freight-api.fly.dev` | Vercel Dashboard            |
| `NEXT_PUBLIC_APP_NAME` | `Infæmous Freight`                     | Vercel Dashboard (optional) |
| `NEXT_PUBLIC_ENV`      | `production`                           | Vercel Dashboard (optional) |

---

## Expected Result

✅ **Web frontend deployed** to Vercel  
✅ **Connected to live API** at <https://infamous-freight-api.fly.dev>  
✅ **All endpoints working** with real database  
✅ **E2E tests passing** (if running against live deployment)

---

## Troubleshooting

### Build Fails with "Cannot find module @infamous-freight/shared"

**Solution**: Shared package must be built before deployment

```bash
pnpm --filter @infamous-freight/shared build
git add packages/shared/dist
git commit -m "build: shared package"
git push origin main
```

### API Calls Return 401 Unauthorized

**Solution**: User is not authenticated

- Check browser console for auth errors
- Verify JWT token is being stored
- Check `NEXT_PUBLIC_API_BASE` is correct in browser DevTools

### CORS Errors

**Solution**: Update `CORS_ORIGINS` in Fly.io secrets

```bash
flyctl secrets set CORS_ORIGINS="http://localhost:3000,https://your-vercel-domain.vercel.app" -a infamous-freight-api
```

### Deployment Hangs or Times Out

**Solution**: Clear Vercel cache and redeploy

1. Go to Vercel dashboard
2. Settings → Git
3. Click **Clear Build Cache**
4. Redeploy from latest commit

---

## Monitoring After Deployment

### Check Live Site

```bash
# Test from command line
curl https://your-vercel-domain.vercel.app

# Check API connectivity
curl -H "Accept: application/json" \
  https://your-vercel-domain.vercel.app
```

### Monitor Performance

- Vercel Analytics: <https://vercel.com/analytics>
- Check Core Web Vitals (LCP, FID, CLS)
- Monitor API response times in browser DevTools

### View Logs

1. Vercel Dashboard → **Deployments**
2. Select latest deployment
3. Click **View Functions** or **Logs**

---

## Rollback Instructions

If deployment has issues:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Vercel automatically redeploys
```

Or in Vercel dashboard:

1. **Deployments** → Select previous working deployment
2. Click **3-dot menu** → **Promote to Production**

---

## Session 2 Complete ✅

- ✅ API running at <https://infamous-freight-api.fly.dev>
- ✅ Database connected (PostgreSQL on Render)
- ✅ E2E tests passing against live API
- ✅ Web frontend ready for Vercel deployment
- ✅ 10 of 10 recommendations completed

**Next deployment**: Just push to main branch! 🚀
