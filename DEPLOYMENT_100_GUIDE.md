# 🚀 Infamous Freight - 100% Deployment Guide

**Status**: Ready for Complete Production Deployment  
**Date**: February 2, 2026  
**Version**: 2.2.0

---

## 🎯 Deployment Overview

### Services Architecture
- **Web App**: Next.js → Vercel
- **API**: Express.js → Railway.app (alternative to Fly.io)
- **Mobile**: React Native → Expo EAS
- **Database**: PostgreSQL → Railway.app
- **Monitoring**: Sentry (already configured)

---

## ✅ 1. WEB APP DEPLOYMENT (Vercel)

### Status: 🔄 **DEPLOYING NOW** (Auto-deployed on GitHub push)

**URL**: https://infamous-freight-enterprises.vercel.app

### Manual Trigger (if needed):
```bash
# Option 1: Via Vercel CLI (install if needed)
npm i -g vercel
cd apps/web
vercel --prod

# Option 2: Via Vercel Dashboard
# Go to: https://vercel.com/dashboard
# Select project → Deploy → Production
```

### Environment Variables (Configure in Vercel Dashboard):
```bash
NEXT_PUBLIC_API_URL=https://your-api.railway.app
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_DD_APP_ID=your_datadog_app_id
NEXT_PUBLIC_DD_CLIENT_TOKEN=your_datadog_client_token
NEXT_PUBLIC_DD_SITE=datadoghq.com
```

---

## 🚂 2. API DEPLOYMENT (Railway.app)

### Quick Start (5 minutes):

#### Step 1: Install Railway CLI
```bash
curl -fsSL cli.new/railway | sh
# Or via npm:
npm i -g @railway/cli
```

#### Step 2: Login & Setup
```bash
railway login
cd /workspaces/Infamous-freight-enterprises
railway init
# Select: "Create new project"
# Name: infamous-freight-api
```

#### Step 3: Add PostgreSQL Database
```bash
railway add --database postgresql
# This creates a PostgreSQL instance and sets DATABASE_URL automatically
```

#### Step 4: Configure Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set API_PORT=3001
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set CORS_ORIGINS="https://infamous-freight-enterprises.vercel.app"
railway variables set AI_PROVIDER=synthetic
railway variables set AVATAR_STORAGE=local
railway variables set LOG_LEVEL=info

# Stripe (if available)
railway variables set STRIPE_SECRET_KEY="your_stripe_key"
railway variables set STRIPE_PUBLISHABLE_KEY="your_stripe_pub_key"

# PayPal (if available)
railway variables set PAYPAL_CLIENT_ID="your_paypal_id"
railway variables set PAYPAL_CLIENT_SECRET="your_paypal_secret"

# Sentry
railway variables set SENTRY_DSN="your_sentry_dsn"
railway variables set SENTRY_ORG="your_sentry_org"
railway variables set SENTRY_PROJECT="your_sentry_project"
```

#### Step 5: Deploy!
```bash
railway up --dockerfile Dockerfile.api
# Or use railway.json config:
railway up
```

#### Step 6: Run Database Migrations
```bash
# Connect to Railway shell
railway run bash

# Inside Railway shell:
cd api
npx prisma migrate deploy
npx prisma db seed  # Optional: seed initial data
exit
```

### Get Your API URL:
```bash
railway domain
# Example output: https://infamous-freight-api.up.railway.app
```

### Monitor Deployment:
```bash
railway logs
railway status
```

---

## 📱 3. MOBILE APP DEPLOYMENT (Expo EAS)

### Prerequisites:
```bash
npm install -g eas-cli
eas login
```

### Configure EAS:
```bash
cd apps/mobile
eas build:configure
```

### Update API URL in Mobile App:
Edit `apps/mobile/.env.production`:
```bash
EXPO_PUBLIC_API_URL=https://your-api.railway.app
EXPO_PUBLIC_ENV=production
```

### Build for iOS & Android:
```bash
cd apps/mobile

# Build for both platforms
eas build --platform all --profile production

# Or individually:
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Submit to App Stores:
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

### Internal Distribution (TestFlight/Google Play Internal Testing):
```bash
eas build --platform all --profile preview
```

---

## 🗄️ 4. DATABASE SETUP & MIGRATIONS

### Railway PostgreSQL (Recommended):
Already set up in Step 2 above. Database URL is automatically configured.

### Alternative: Supabase (Free Tier):
```bash
# 1. Create account at https://supabase.com
# 2. Create new project
# 3. Get DATABASE_URL from Settings → Database
# 4. Set in Railway:
railway variables set DATABASE_URL="postgresql://..."
```

### Run Migrations:
```bash
# Via Railway shell
railway run bash
cd api
npx prisma migrate deploy

# Or locally (connecting to Railway DB)
cd apps/api
railway run npx prisma migrate deploy
```

### Verify Database:
```bash
railway run npx prisma studio
# Opens Prisma Studio to view/edit data
```

---

## 🔐 5. PRODUCTION SECRETS CONFIGURATION

### Generate Strong Secrets:
```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# API Keys (if you have them):
# - Stripe: https://dashboard.stripe.com/apikeys
# - PayPal: https://developer.paypal.com/dashboard/applications
# - OpenAI: https://platform.openai.com/api-keys
# - Anthropic: https://console.anthropic.com/settings/keys
# - Sentry: https://sentry.io/settings/auth-tokens/
```

### Set in Railway:
```bash
railway variables set JWT_SECRET="your_generated_secret"
railway variables set OPENAI_API_KEY="sk-..." # If available
railway variables set ANTHROPIC_API_KEY="sk-ant-..." # If available
```

### Set in Vercel (Web App):
Go to: https://vercel.com/dashboard → Project → Settings → Environment Variables

Add:
- `NEXT_PUBLIC_API_URL` = Your Railway API URL
- `NEXT_PUBLIC_SENTRY_DSN` = Your Sentry DSN
- `NEXT_PUBLIC_ENV` = `production`

Then **redeploy** the web app.

---

## 🏥 6. HEALTH CHECKS & MONITORING

### API Health Endpoint:
```bash
curl https://your-api.railway.app/api/health

# Expected response:
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": 1738526400000,
  "database": "connected"
}
```

### Web App Health:
Visit: https://infamous-freight-enterprises.vercel.app

### Sentry Monitoring:
Already configured. Check: https://sentry.io/organizations/your-org/projects/

### Railway Monitoring:
```bash
railway logs --tail 100
railway metrics
```

### Setup Uptime Monitoring (Optional):
- **UptimeRobot** (Free): https://uptimerobot.com
  - Monitor: `https://your-api.railway.app/api/health`
  - Interval: 5 minutes
  
- **Better Uptime** (Free): https://betteruptime.com
  - Monitor: Web + API
  - Alert via email/Slack

---

## 🔄 7. CI/CD AUTOMATION

### GitHub Actions (Already Configured):
- `.github/workflows/ci.yml` - Runs tests on PR
- `.github/workflows/deploy.yml` - Auto-deploys on merge to main

### Enable GitHub → Railway Auto-Deploy:
```bash
# In Railway dashboard:
# Settings → Deploy → Connect to GitHub
# Select repository: MrMiless44/Infamous-freight
# Branch: main
# Auto-deploy: ✅ Enabled
```

---

## 📊 8. POST-DEPLOYMENT VERIFICATION

### Comprehensive Checklist:

#### Web App:
- [ ] https://infamous-freight-enterprises.vercel.app loads
- [ ] Login page accessible: `/auth/sign-in`
- [ ] Dashboard loads: `/dashboard`
- [ ] No console errors in browser dev tools
- [ ] Sentry integration working (check Sentry dashboard)

#### API:
- [ ] Health endpoint responds: `/api/health`
- [ ] CORS configured correctly (test from web app)
- [ ] JWT authentication working (test login)
- [ ] Database connected (check health endpoint)
- [ ] Stripe/PayPal integration (if configured)
- [ ] AI endpoints responding (test `/api/ai/commands`)

#### Mobile App:
- [ ] TestFlight/Internal build available
- [ ] API connection working
- [ ] Auth flow functional
- [ ] Push notifications configured (if enabled)

#### Database:
- [ ] Migrations applied: `railway run npx prisma migrate status`
- [ ] Seed data loaded (if applicable)
- [ ] Backups enabled in Railway dashboard

#### Monitoring:
- [ ] Sentry receiving errors
- [ ] Railway logs accessible
- [ ] Uptime monitoring active (if configured)

---

## 🚨 9. TROUBLESHOOTING

### API Won't Start:
```bash
# Check logs
railway logs --tail 100

# Common issues:
# 1. Missing DATABASE_URL
railway variables set DATABASE_URL="postgresql://..."

# 2. Port mismatch
railway variables set PORT=$PORT

# 3. Build failed
railway up --dockerfile Dockerfile.api --verbose
```

### Database Connection Issues:
```bash
# Test connection
railway run npx prisma db pull

# Reset (⚠️ DANGER: Deletes all data)
railway run npx prisma migrate reset --force
```

### Web App 500 Errors:
1. Check Vercel logs: https://vercel.com/dashboard → Logs
2. Verify `NEXT_PUBLIC_API_URL` is set correctly
3. Redeploy: `vercel --prod` or via dashboard

### CORS Errors:
```bash
# Update CORS_ORIGINS in Railway
railway variables set CORS_ORIGINS="https://infamous-freight-enterprises.vercel.app,http://localhost:3000"
railway restart
```

---

## 📈 10. SCALING & OPTIMIZATION

### Railway Scaling:
```bash
# Upgrade plan for:
# - More memory (default: 512MB → 8GB)
# - More CPU (default: shared → dedicated)
# - Custom domains
# - Team collaboration

# Go to: https://railway.app/pricing
```

### Database Optimization:
```bash
# Enable connection pooling
railway variables set DATABASE_POOL_SIZE=10
railway variables set DATABASE_POOL_TIMEOUT=30

# Monitor query performance
railway run npx prisma studio
```

### CDN Configuration:
Vercel automatically provides global CDN for web app.

For API:
- Use Railway's built-in CDN
- Or add Cloudflare in front: https://developers.cloudflare.com

---

## 🎉 SUCCESS METRICS

### Deployment is 100% Complete When:

1. ✅ Web app accessible at production URL
2. ✅ API health check responds with `200 OK`
3. ✅ Database migrations applied successfully
4. ✅ Mobile app builds successfully (EAS)
5. ✅ All environment variables configured
6. ✅ Monitoring active (Sentry/logs)
7. ✅ CORS configured for web→API communication
8. ✅ Authentication flow working end-to-end
9. ✅ No critical errors in logs
10. ✅ Team can access all services

---

## 🔗 QUICK LINKS

### Production URLs:
- **Web**: https://infamous-freight-enterprises.vercel.app
- **API**: https://infamous-freight-api.railway.app (set after deployment)
- **Mobile**: App Store / Google Play (post-submission)

### Dashboards:
- **Vercel**: https://vercel.com/dashboard
- **Railway**: https://railway.app/dashboard
- **Expo**: https://expo.dev/accounts/your-account/projects
- **Sentry**: https://sentry.io/organizations/your-org/projects
- **GitHub**: https://github.com/MrMiless44/Infamous-freight

### Documentation:
- Railway Docs: https://docs.railway.app
- Expo EAS: https://docs.expo.dev/eas
- Prisma: https://www.prisma.io/docs
- Next.js: https://nextjs.org/docs

---

## 📞 SUPPORT

### Issues or Questions?
- Check Railway logs: `railway logs`
- Review Sentry errors: https://sentry.io
- GitHub Issues: https://github.com/MrMiless44/Infamous-freight/issues

---

**Deployment Guide Version**: 1.0.0  
**Last Updated**: February 2, 2026  
**Maintained By**: Infamous Freight DevOps Team

🚀 **Ready to deploy? Start with Step 1 (Vercel is already deploying) and continue with Step 2 (Railway API)!**
