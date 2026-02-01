# 🚀 DEPLOYMENT IN PROGRESS

## Current Status

✅ **flyctl installed** - v0.4.0  
🔄 **Authentication in progress** - Browser window opened  
⏳ **Waiting for you to complete authentication**

## What's Happening Now

1. A browser window has opened to: https://fly.io/app/auth/cli/...
2. Sign in or create a Fly.io account (free tier available)
3. After authentication, the terminal will continue automatically

## Once Authentication Completes

### Option A: Automatic (Recommended)

Run the complete deployment script:

```bash
./scripts/complete-fly-deploy.sh
```

This will:

- ✅ Create the app if it doesn't exist
- ✅ Create PostgreSQL database (with your confirmation)
- ✅ Generate and set JWT_SECRET
- ✅ Deploy the application
- ✅ Verify the deployment
- ✅ Test the health endpoint

### Option B: Manual Steps

If you prefer manual control:

```bash
# 1. Create app (if needed)
flyctl apps create infamous-freight-api --region iad

# 2. Create and attach database
flyctl pg create --name infamous-freight-db --region iad
flyctl pg attach infamous-freight-db -a infamous-freight-api

# 3. Set JWT secret
flyctl secrets set JWT_SECRET=$(openssl rand -base64 32) -a infamous-freight-api

# 4. Deploy
flyctl deploy

# 5. Check status
flyctl status -a infamous-freight-api

# 6. View logs
flyctl logs -a infamous-freight-api
```

## What's Already Prepared

✅ **fly.toml** - Fly.io configuration at project root  
✅ **Dockerfile.fly** - Optimized multi-stage build  
✅ **All dependencies verified** - pnpm-lock.yaml, package.json, Prisma schema  
✅ **Scripts created**:

- `scripts/complete-fly-deploy.sh` - Full automated deployment
- `scripts/deploy-fly.sh` - Diagnostic helper
- `scripts/fly-auth.sh` - Authentication helper

## After Successful Deployment

### Test Your API

```bash
# Get your app URL
APP_URL=$(flyctl info -a infamous-freight-api | grep Hostname | awk '{print $3}')

# Test health endpoint
curl https://$APP_URL/api/health

# Or visit in browser
open https://$APP_URL/api/health
```

### Run Database Migrations

```bash
# SSH into your app
flyctl ssh console -a infamous-freight-api

# Inside the container
cd /app
node dist/server.js
# Or run migrations: pnpm run prisma:migrate
```

### Set Optional Secrets

```bash
# For Stripe
flyctl secrets set STRIPE_SECRET_KEY="sk_live_..." -a infamous-freight-api
flyctl secrets set STRIPE_PUBLISHABLE_KEY="pk_live_..." -a infamous-freight-api

# For PayPal
flyctl secrets set PAYPAL_CLIENT_ID="..." -a infamous-freight-api
flyctl secrets set PAYPAL_CLIENT_SECRET="..." -a infamous-freight-api

# For AI (defaults to synthetic)
flyctl secrets set AI_PROVIDER="synthetic" -a infamous-freight-api
```

### Monitor Your App

```bash
# Real-time logs
flyctl logs -a infamous-freight-api

# App status
flyctl status -a infamous-freight-api

# View in dashboard
open https://fly.io/apps/infamous-freight-api
```

## Troubleshooting

If deployment fails:

1. Check [deploy/FLY_TROUBLESHOOTING.md](deploy/FLY_TROUBLESHOOTING.md)
2. View logs: `flyctl logs -a infamous-freight-api`
3. Check recent releases: `flyctl releases -a infamous-freight-api`
4. Rollback if needed: `flyctl releases rollback <version> -a infamous-freight-api`

## Quick Commands Reference

| Command                        | Purpose                       |
| ------------------------------ | ----------------------------- |
| `flyctl deploy`                | Deploy latest changes         |
| `flyctl logs`                  | View real-time logs           |
| `flyctl status`                | Check app status              |
| `flyctl ssh console`           | SSH into running app          |
| `flyctl secrets list`          | View set secrets (not values) |
| `flyctl secrets set KEY=value` | Set environment variable      |
| `flyctl scale memory 2048`     | Increase memory to 2GB        |
| `flyctl scale count 2`         | Scale to 2 instances          |
| `flyctl releases`              | View deployment history       |

## Deployment Checklist

- [ ] Fly.io authentication complete
- [ ] App created on Fly.io
- [ ] PostgreSQL database created
- [ ] Database attached to app
- [ ] JWT_SECRET set
- [ ] Application deployed
- [ ] Health check passes
- [ ] Database migrations run (if needed)
- [ ] Optional secrets set (Stripe, PayPal, etc.)
- [ ] Monitoring set up

## Files Structure

```
/
├── fly.toml                          # Main Fly.io config ✅
├── Dockerfile.fly                    # Optimized Dockerfile ✅
├── scripts/
│   ├── complete-fly-deploy.sh        # Automated deployment ✅
│   ├── deploy-fly.sh                 # Diagnostic tool ✅
│   └── fly-auth.sh                   # Auth helper ✅
├── deploy/
│   ├── FLY_TROUBLESHOOTING.md        # Full troubleshooting guide ✅
│   └── fly-env.md                    # Environment variables reference
└── FLY_IO_FIX.md                     # Quick reference ✅
```

---

**Next Step**: Complete authentication in the browser, then run:

```bash
./scripts/complete-fly-deploy.sh
```
