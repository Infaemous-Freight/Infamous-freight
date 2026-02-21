# 🚀 Production Deployment Guide

## Quick Deploy Options

### Option 1: Render.com (Recommended - Easiest)

**Why Render?**

- Free tier available
- Automatic HTTPS
- PostgreSQL included
- Zero config needed

**Deploy Steps:**

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Production ready with billing system"
   git push origin main
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub
   - Authorize Render to access your repos

3. **Deploy from Dashboard**
   - Click "New +" → "Blueprint"
   - Select `Infamous-Freight-Enterprises` repo
   - Render will auto-detect `render.yaml`
   - Click "Apply"
   - Wait 5-10 minutes for deployment

4. **Add Stripe Keys** (After deployment)
   - Dashboard → infamous-freight-api → Environment
   - Add `STRIPE_API_SECRET`: `sk_live_...`
   - Add `STRIPE_WEBHOOK_SECRET`: `whsec_...`
   - Save changes (auto-redeploys)

5. **Your URLs**
   - Web: `https://infamous-freight-web.onrender.com`
   - API: `https://infamous-freight-api.onrender.com`

**Cost:** FREE for starter tier (upgradable to $7/month per service)

---

### Option 2: Fly.io (Advanced - Better Performance)

**Why Fly?**

- Global edge deployment
- Better performance
- More control
- Free tier: 3 VMs

**Deploy Steps:**

1. **Install Fly CLI**

   ```bash
   brew install flyctl
   # Or: curl -L https://fly.io/install.sh | sh
   ```

2. **Login & Launch**

   ```bash
   flyctl auth login
   cd /Users/mrmiless/IFE/infamous-freight-ai
   flyctl launch
   ```

3. **Deploy Database**

   ```bash
   flyctl postgres create --name infamous-freight-db
   flyctl postgres attach infamous-freight-db
   ```

4. **Set Secrets**

   ```bash
   flyctl secrets set STRIPE_API_SECRET=sk_live_...
   flyctl secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   flyctl secrets set AUTH_SECRET=$(openssl rand -hex 32)
   ```

5. **Deploy**

   ```bash
   flyctl deploy
   ```

6. **Your URL**
   - `https://infamous-freight.fly.dev`

**Cost:** FREE for 3 shared VMs (enough to start)

---

### Option 3: Vercel + Render (Hybrid - Best for Next.js)

**Why Hybrid?**

- Vercel optimized for Next.js (web)
- Render handles API + database
- Best performance combo

**Deploy Steps:**

1. **Deploy API to Render** (Follow Option 1, steps 1-4)

2. **Deploy Web to Vercel**

   ```bash
   pnpm add -g vercel@latest
   cd apps/web
   vercel login
   vercel --prod
   ```

3. **Link API**
   - Vercel Dashboard → Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_BASE`: `https://infamous-freight-api.onrender.com`

4. **Your URLs**
   - Web: `https://infamous-freight.vercel.app`
   - API: `https://infamous-freight-api.onrender.com`

**Cost:** FREE (Vercel hobby + Render free tier)

---

## Post-Deployment Checklist

### ✅ Essential (Do First)

- [x] **Test Web**: Visit your public URL
- [x] **Test API**: `curl https://your-api-url.com/api/health`
- [x] **Test Pricing**: Visit `/pricing` page
- [x] **Add Stripe Keys**: Configure payment processing
- [x] **Custom Domain**: Point your domain (optional)

### 🔒 Security (Do Today)

- [x] **Environment Secrets**: Never commit real API keys
- [x] **CORS**: Update allowed origins in production
- [x] **Rate Limiting**: Verify it's working
- [x] **Database Backups**: Enable on Render/Fly
- [x] **SSL Certificate**: Auto-enabled on Render/Vercel

### 📊 Monitoring (Do This Week)

- [x] **Error Tracking**: Add Sentry (free tier)
- [x] **Analytics**: Add Plausible or Google Analytics
- [x] **Uptime Monitor**: UptimeRobot.com (free)
- [x] **Performance**: Lighthouse score check

---

## Production Environment Variables

### Critical (Required)

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
AUTH_SECRET=your_32_char_random_string_here
STRIPE_API_SECRET=sk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Optional (Recommended)

```bash
AI_SYNTHETIC_API_KEY=your_ai_key
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SENTRY_DSN=https://...@sentry.io/...
```

---

## Custom Domain Setup

### 1. Buy Domain ($10-15/year)

- Namecheap.com
- Google Domains
- Cloudflare Registrar

### 2. Point to Render

```
Type: CNAME
Name: @
Value: infamous-freight-web.onrender.com

Type: CNAME
Name: api
Value: infamous-freight-api.onrender.com
```

### 3. Enable HTTPS

- Render auto-provisions SSL (free)
- Wait 5-10 minutes for DNS propagation

### Your URLs:

- `https://infamousfreight.ai`
- `https://api.infamousfreight.ai`

---

## Troubleshooting

### Build Fails

```bash
# Check logs
render logs --tail=100 infamous-freight-api

# Common fixes:
# 1. Missing dependencies → Check package.json
# 2. Port issues → Ensure PORT env var set
# 3. Database → Verify DATABASE_URL
```

### API Returns 500

```bash
# Check environment variables
render env list infamous-freight-api

# Check database connection
render run --service=infamous-freight-api -- npx prisma db push
```

### Web Shows Error

```bash
# Verify API is accessible
curl https://your-api.onrender.com/api/health

# Check CORS settings
# Update apps/api/src/server.js CORS_ORIGINS
```

---

## Performance Optimization

### 1. Enable Caching

```javascript
// Add to apps/web/next.config.mjs
module.exports = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
    },
  ],
};
```

### 2. Database Connection Pool

```javascript
// Add to apps/api/src/server.js
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=10",
    },
  },
});
```

### 3. CDN for Assets

- Use Vercel/Cloudflare for static files
- Compress images (Next.js does this automatically)
- Enable HTTP/2

---

## Scaling Strategy

### Stage 1: Free Tier (0-100 users)

- Render free tier
- 1 web instance
- 1 API instance
- Shared database

**Cost:** $0/month  
**Capacity:** ~100 concurrent users

### Stage 2: Starter Tier (100-1K users)

- Upgrade to Render Starter ($7/service)
- 2 API instances (load balanced)
- Dedicated database
- Add Redis cache

**Cost:** ~$30/month  
**Capacity:** ~1,000 concurrent users

### Stage 3: Growth Tier (1K-10K users)

- Professional plan ($25/service)
- 4+ API instances
- Database with replicas
- CDN + caching
- Background job workers

**Cost:** ~$200/month  
**Capacity:** ~10,000 concurrent users

---

## Marketing Launch Plan

### Week 1: Soft Launch

1. Share with 10 beta testers
2. Get feedback
3. Fix critical bugs
4. Collect testimonials

### Week 2: Public Launch

1. Product Hunt launch
2. LinkedIn announcement
3. Reddit (r/logistics, r/trucking)
4. Trucking forums
5. Facebook groups

### Week 3: Paid Ads

1. Google Ads: "AI fleet management"
2. LinkedIn Ads: target logistics managers
3. Facebook: trucking communities

### Week 4: Content Marketing

1. Blog: "How AI saves trucking companies $10K/month"
2. Case study: First customer results
3. YouTube: Product demo video

---

## Success Metrics

### Week 1 Targets

- ✅ Site is live and accessible
- ✅ 0 downtime
- ✅ <2s page load time
- ✅ 5 demo signups

### Month 1 Targets

- 🎯 50 trial signups
- 🎯 5 paying customers
- 🎯 $745 MRR
- 🎯 99.9% uptime

### Month 3 Targets

- 🎯 200 trial signups
- 🎯 20 paying customers
- 🎯 $5,000 MRR
- 🎯 First enterprise deal

---

## 🚀 Ready to Deploy?

**Fastest Path (10 minutes):**

1. Push code: `git push origin main`
2. Go to: https://render.com
3. Connect repo
4. Click "Apply Blueprint"
5. Wait for deployment
6. **You're live!** 🎉

**Your site will be at:** `https://infamous-freight-web.onrender.com`

---

## Support & Resources

### Documentation

- Render Docs: https://render.com/docs
- Fly.io Docs: https://fly.io/docs
- Next.js Deploy: https://nextjs.org/docs/deployment

### Community

- Discord: Join Render community
- Forum: https://community.render.com
- GitHub Issues: Your repo

### Get Help

- Render Support: dashboard → Help
- Stack Overflow: Tag `render` or `fly.io`
- Email: (Your support email once set up)

---

**🎊 Congratulations! Your startup is ready to go live and make money!**
