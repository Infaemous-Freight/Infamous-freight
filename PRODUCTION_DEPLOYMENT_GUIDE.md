# Production Deployment Complete Guide - 100%

**Date**: February 1, 2026  
**Status**: Ready to Deploy  
**Targets**: Vercel + Fly.io

---

## 🚀 Quick Deploy Commands

### Prerequisites Completed ✅
- ✅ Production configs created ([vercel.json](apps/web/vercel.json), [netlify.toml](apps/web/netlify.toml))
- ✅ Deployment scripts ready
- ✅ Repository pushed to GitHub
- ✅ Environment template created

### What You Need
- Supabase project URL and API keys (from https://supabase.com/dashboard)
- Vercel account (sign up at https://vercel.com)
- Fly.io account (sign up at https://fly.io)

---

## 🎯 Option 1: Deploy to Vercel (Recommended - Easiest)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
# or use npx (no install needed)
```

### Step 2: Login to Vercel
```bash
npx vercel login
# Opens browser for authentication
```

### Step 3: Deploy to Production
```bash
cd /workspaces/Infamous-freight-enterprises/apps/web
npx vercel --prod
```

You'll be prompted for:
- **Set up and deploy**: Yes
- **Which scope**: Your Vercel account
- **Link to existing project**: No (first time) or Yes (subsequent)
- **Project name**: infamous-freight-web
- **Directory**: `./` (current directory is already apps/web)
- **Override settings**: No

### Step 4: Add Environment Variables

**Option A: Via Vercel Dashboard (Easier)**
1. Go to https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add these variables (for Production):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (mark as sensitive)
   ```
4. Redeploy: `npx vercel --prod`

**Option B: Via CLI**
```bash
cd apps/web
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste value when prompted

npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste value when prompted

npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste value when prompted
```

### Step 5: Verify Deployment
```bash
# Get deployment URL
npx vercel ls

# Visit the URL (e.g., https://infamous-freight-web.vercel.app)
```

---

## 🚁 Option 2: Deploy to Fly.io

### Step 1: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"
```

### Step 2: Login to Fly.io
```bash
fly auth login
# Opens browser for authentication
```

### Step 3: Launch Fly App
```bash
cd /workspaces/Infamous-freight-enterprises

# If fly.toml exists, use it; otherwise create new app
fly launch --no-deploy
```

You'll be prompted for:
- **App name**: infamous-freight-web
- **Region**: Choose closest to your users
- **Postgres**: No (using Supabase)
- **Redis**: No (optional, can add later)

### Step 4: Set Secrets (Environment Variables)
```bash
# Set Supabase environment variables as secrets
fly secrets set NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
fly secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
```

### Step 5: Deploy
```bash
fly deploy --remote-only
```

This uses Fly's remote builder (no local Docker needed).

### Step 6: Verify Deployment
```bash
fly status
fly open  # Opens app in browser
```

---

## 🔧 Option 3: Deploy to Both (Maximum Availability)

### Deploy to Vercel (Primary)
```bash
cd /workspaces/Infamous-freight-enterprises/apps/web
npx vercel login
npx vercel --prod
# Add env vars via dashboard or CLI
```

### Deploy to Fly.io (Backup/Alternative Region)
```bash
cd /workspaces/Infamous-freight-enterprises
fly auth login
fly launch --no-deploy
fly secrets set NEXT_PUBLIC_SUPABASE_URL="..."
fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
fly secrets set SUPABASE_SERVICE_ROLE_KEY="..."
fly deploy --remote-only
```

---

## 📋 Supabase Setup (Required Before Deployment)

If you haven't set up Supabase Cloud yet:

### Quick Setup via Script (5 minutes)
```bash
cd /workspaces/Infamous-freight-enterprises
./scripts/setup-supabase-cloud.sh
```

This will:
1. Login to Supabase
2. Link your project
3. Push database migrations
4. Deploy Edge Functions
5. Generate `.env.local` with your keys

### Manual Setup
1. **Create Supabase Project**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Set name, password, region
   - Wait ~2 minutes for setup

2. **Get API Keys**
   - Go to Settings → API
   - Copy:
     - Project URL
     - `anon` public key
     - `service_role` key (keep secret!)

3. **Apply Database Migrations**
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

4. **Deploy Edge Functions**
   ```bash
   npx supabase functions deploy analytics
   npx supabase functions deploy shipment-tracking
   ```

---

## ✅ Post-Deployment Checklist

### Verify Vercel Deployment
- [ ] App loads at Vercel URL
- [ ] No build errors in Vercel dashboard
- [ ] Environment variables set correctly
- [ ] Supabase connection works
- [ ] Pages render without errors

### Verify Fly.io Deployment
- [ ] App status shows "running" (`fly status`)
- [ ] App accessible at Fly.io URL
- [ ] Secrets configured (`fly secrets list`)
- [ ] Logs show no errors (`fly logs`)

### Verify Supabase
- [ ] Database tables exist (9 tables)
- [ ] RLS policies active (40+ policies)
- [ ] Storage buckets created (5 buckets)
- [ ] Edge Functions deployed (2 functions)
- [ ] Can authenticate users
- [ ] Can query database

---

## 🔍 Troubleshooting

### Vercel: "Token is not valid"
```bash
npx vercel login
# Follow browser prompts
```

### Vercel: "Build failed"
```bash
# Check build logs in Vercel dashboard
# Common fix: ensure environment variables are set
npx vercel env ls
```

### Fly.io: "App not found"
```bash
fly auth login
fly launch  # Creates new app if needed
```

### Fly.io: "Deployment failed"
```bash
# Check logs
fly logs

# Common fix: increase VM size
fly scale vm shared-cpu-2x
```

### Supabase: "Project not linked"
```bash
npx supabase login
npx supabase link --project-ref YOUR_REF
```

### Supabase: "Migrations failed"
```bash
# Reset database (WARNING: deletes data)
npx supabase db reset

# Or apply specific migration
npx supabase migration up
```

---

## 📊 Deployment Comparison

| Feature | Vercel | Fly.io |
|---------|--------|--------|
| **Setup Difficulty** | Easy | Medium |
| **Build Time** | Fast (~2 min) | Medium (~5 min) |
| **Global CDN** | ✅ Yes | ✅ Yes |
| **Auto Scaling** | ✅ Yes | ✅ Yes |
| **Free Tier** | ✅ Generous | ✅ Limited |
| **Custom Regions** | ❌ No | ✅ Yes |
| **WebSockets** | ⚠️ Limited | ✅ Full |
| **Docker Support** | ❌ No | ✅ Yes |
| **Best For** | Next.js apps | Full-stack apps |

**Recommendation**: Start with Vercel (easier), add Fly.io for advanced features.

---

## 🎓 Next Steps After Deployment

### Monitor Performance
1. **Vercel Analytics** → https://vercel.com/dashboard/analytics
2. **Fly.io Metrics** → `fly dashboard`
3. **Supabase Metrics** → Dashboard → Reports

### Set Up Custom Domain
```bash
# Vercel
npx vercel domains add yourdomain.com

# Fly.io
fly certs add yourdomain.com
```

### Configure CI/CD
GitHub Actions will auto-deploy on push:
- Vercel: Automatic (GitHub integration)
- Fly.io: Add GitHub Action (see `.github/workflows/fly.yml`)

### Enable Monitoring
- **Sentry**: Error tracking
- **Datadog**: Performance monitoring
- **LogRocket**: Session replay

---

## 📚 Additional Resources

### Documentation
- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
- [Fly.io Deployment Docs](https://fly.io/docs/hands-on/launch-app/)
- [Supabase Production Guide](https://supabase.com/docs/guides/platform/going-into-prod)

### Project Documentation
- [SUPABASE_100_COMPLETE.md](SUPABASE_100_COMPLETE.md) - Full Supabase guide
- [docs/SUPABASE_CLOUD_SETUP.md](docs/SUPABASE_CLOUD_SETUP.md) - Cloud setup
- [ALL_RECOMMENDATIONS_IMPLEMENTED_100.md](ALL_RECOMMENDATIONS_IMPLEMENTED_100.md) - Implementation summary

### Scripts
- `./scripts/setup-supabase-cloud.sh` - Automated Supabase setup
- `./scripts/validate-all.sh` - Pre-deployment validation
- `./scripts/quick-start.sh` - Development quick start

---

## 🎯 Deployment Summary

### Ready to Deploy ✅
1. **Vercel**: `cd apps/web && npx vercel --prod`
2. **Fly.io**: `fly deploy --remote-only`
3. **Both**: Run both commands above

### Environment Variables Required
```bash
# Get from Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Expected Deployment Time
- **Vercel**: 3-5 minutes
- **Fly.io**: 5-10 minutes
- **Supabase**: 10-15 minutes (first time)
- **Total**: 20-30 minutes for full setup

---

**Status**: 🚀 READY FOR PRODUCTION DEPLOYMENT  
**Last Updated**: February 1, 2026  
**Version**: 1.0.0
