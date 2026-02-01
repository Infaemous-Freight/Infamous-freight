# 🚀 Deployment Status Dashboard

> **Last Updated**: Auto-generated on push to main

## 📊 Service Health

| Service       | Platform | Status                                                          | URL                                                                                        | Health |
| ------------- | -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| 🌐 **Web**    | Vercel   | ![Vercel](https://img.shields.io/badge/vercel-deployed-success) | [Live](https://infamous-freight-enterprises-git-f34b9b-santorio-miles-projects.vercel.app) | ✅     |
| 🔌 **API**    | Fly.io   | ![Fly.io](https://img.shields.io/badge/fly.io-deployed-success) | [Live](https://infamous-freight-api.fly.dev)                                               | ✅     |
| 📱 **Mobile** | Expo     | ![Expo](https://img.shields.io/badge/expo-published-success)    | [Project](https://expo.dev/@infamous-freight/mobile)                                       | ✅     |

## 🤖 Auto-Deployment Status

| Workflow          | Status                                                                                                           | Trigger                 | Last Run    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------- |
| **Main CI/CD**    | ![Auto Deploy](https://github.com/santorio-miles/infamous-freight-enterprises/workflows/Auto%20Deploy/badge.svg) | Push to `main`          | Automated   |
| **API Deploy**    | Part of Auto Deploy                                                                                              | API changes detected    | Conditional |
| **Web Deploy**    | Part of Auto Deploy                                                                                              | Web changes detected    | Conditional |
| **Mobile Deploy** | Part of Auto Deploy                                                                                              | Mobile changes detected | Conditional |

## 📈 Deployment Metrics

### API (Fly.io)

```bash
# Check API health
curl https://infamous-freight-api.fly.dev/api/health

# View metrics
flyctl metrics --app infamous-freight-api

# View logs
flyctl logs --app infamous-freight-api
```

**Current Configuration:**

- **Region**: North America (multi-region ready)
- **Instances**: 1-3 (auto-scaling)
- **Memory**: 1GB per instance
- **CPU**: Shared vCPU
- **Health Check**: HTTP GET /api/health every 30s

### Web (Vercel)

```bash
# Check deployment status
vercel ls

# View logs
vercel logs infamous-freight-enterprises --follow
```

**Current Configuration:**

- **Framework**: Next.js 14
- **Build**: Auto-detected
- **Region**: Global Edge Network
- **Analytics**: Enabled
- **Speed Insights**: Enabled

### Mobile (Expo)

```bash
# Check build status
eas build:list

# View OTA updates
eas update:list

# Check submission status
eas submit:list
```

**Current Configuration:**

- **iOS**: App Store builds
- **Android**: Play Store builds
- **OTA**: Enabled for instant updates
- **Auto-increment**: Enabled

## 🔄 Change Detection

The auto-deploy workflow uses smart path detection:

| Path Changed             | Services Deployed |
| ------------------------ | ----------------- |
| `src/apps/api/**`        | API only          |
| `src/apps/web/**`        | Web only          |
| `src/apps/mobile/**`     | Mobile only       |
| `src/packages/shared/**` | All services      |
| `.github/workflows/**`   | All services      |

## 🔐 Required Secrets

Verify all secrets are configured:

```bash
# Check GitHub secrets (requires gh CLI)
gh secret list

# Expected secrets:
# - FLY_API_TOKEN
# - VERCEL_TOKEN
# - EXPO_TOKEN
# - NEXT_PUBLIC_API_URL
```

## 📝 Deployment Commands

### Manual Deploy (when needed)

```bash
# Deploy API to Fly.io
./scripts/complete-fly-deploy.sh

# Deploy Web to Vercel
cd src/apps/web && vercel --prod

# Deploy Mobile to Expo
cd src/apps/mobile && eas build --platform all
```

### Check All Deployments

```bash
# Run comprehensive health check
./scripts/check-deployments.sh
```

Expected output:

```
================================
🚀 Deployment Status Check
================================

🌐 Checking Web...
✅ Web is live - https://infamous-freight-enterprises-git-f34b9b-santorio-miles-projects.vercel.app (HTTP 200)

🔌 Checking API...
✅ API is live - https://infamous-freight-api.fly.dev/api/health (HTTP 200)
   Uptime: 12345.67 seconds

📱 Checking Mobile App...
✅ Mobile project is live - https://expo.dev/@infamous-freight/mobile

================================
🎯 Summary
================================
✅ All services operational (3/3)
```

## 🐛 Troubleshooting

### API Not Deploying

1. **Check Fly.io status**: `flyctl status --app infamous-freight-api`
2. **View logs**: `flyctl logs --app infamous-freight-api`
3. **Check health**: `curl https://infamous-freight-api.fly.dev/api/health`
4. **Verify secrets**: Ensure `FLY_API_TOKEN` is set in GitHub

### Web Not Deploying

1. **Check Vercel status**: `vercel ls`
2. **View logs**: `vercel logs`
3. **Check build**: Visit Vercel dashboard
4. **Verify secrets**: Ensure `VERCEL_TOKEN` is set in GitHub

### Mobile Build Failing

1. **Check EAS status**: `eas build:list`
2. **View logs**: Click build link in EAS dashboard
3. **Check credentials**: `eas credentials`
4. **Verify secrets**: Ensure `EXPO_TOKEN` is set in GitHub

### Auto-Deploy Not Triggering

1. **Check workflow runs**: Visit GitHub Actions tab
2. **Verify branch**: Must be `main` branch
3. **Check paths**: Ensure changed files match path filters
4. **Review logs**: Click failed workflow for details

## 🎯 Quick Actions

| Action                 | Command                                  |
| ---------------------- | ---------------------------------------- |
| Setup everything       | `./scripts/setup-auto-deploy.sh`         |
| Check all deployments  | `./scripts/check-deployments.sh`         |
| Deploy API manually    | `./scripts/complete-fly-deploy.sh`       |
| Run database migration | `./scripts/fly-migrate.sh`               |
| View API logs          | `flyctl logs --app infamous-freight-api` |
| View Web logs          | `vercel logs --follow`                   |
| View Mobile builds     | `eas build:list`                         |

## 📚 Documentation

- [Complete Deployment Guide](/deploy/100_PERCENT_AUTO_DEPLOY.md)
- [Setup Instructions](/deploy/AUTO_DEPLOY_SETUP.md)
- [Fly.io Troubleshooting](/deploy/FLY_TROUBLESHOOTING.md)
- [Fly.io Monitoring](/deploy/FLY_MONITORING.md)
- [Fly.io Best Practices](/deploy/FLY_RECOMMENDATIONS.md)

## 🎉 Success Criteria

Your deployment is 100% ready when:

- ✅ All 3 services show green status
- ✅ Health checks pass
- ✅ Auto-deploy workflow runs on push to main
- ✅ Change detection works correctly
- ✅ All GitHub secrets configured
- ✅ Monitoring and alerts active

---

**Need help?** Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) or run `./scripts/check-deployments.sh`
