# 🚀 Deploy Web Frontend to Fly.io

Deploy the Next.js web frontend to Fly.io alongside the API.

## 📋 Prerequisites

- Fly.io CLI installed and authenticated
- API already deployed to Fly.io

## 🔧 Setup

### 1. Create Fly.io App (First Time Only)

```bash
# Create the app
flyctl apps create infamous-freight-enterprises-ra8cwg --org personal

# Or use existing app shown in fly.web.toml
```

### 2. Set Environment Variables

```bash
# Set the API URL to point to your deployed API
flyctl secrets set \
  NEXT_PUBLIC_API_URL="https://infamous-freight-api.fly.dev" \
  -a infamous-freight-enterprises-ra8cwg

# Optional: Analytics keys
flyctl secrets set \
  NEXT_PUBLIC_DD_APP_ID="your-dd-app-id" \
  NEXT_PUBLIC_DD_CLIENT_TOKEN="your-dd-token" \
  NEXT_PUBLIC_DD_SITE="datadoghq.com" \
  -a infamous-freight-enterprises-ra8cwg
```

## 🚀 Deploy

### Option 1: Deploy from Local

```bash
# Deploy using the web config
flyctl deploy --config fly.web.toml --dockerfile Dockerfile.web

# Or specify the app explicitly
flyctl deploy \
  --config fly.web.toml \
  --dockerfile Dockerfile.web \
  -a infamous-freight-enterprises-ra8cwg
```

### Option 2: Deploy via GitHub Actions

Create `.github/workflows/fly-deploy-web.yml`:

```yaml
name: Deploy Web to Fly.io

on:
  push:
    branches: [main]
    paths:
      - "web/**"
      - "packages/shared/**"
      - "Dockerfile.web"
      - "fly.web.toml"
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy Web
        run: flyctl deploy --config fly.web.toml --dockerfile Dockerfile.web --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

## 🔍 Verify Deployment

```bash
# Check status
flyctl status -a infamous-freight-enterprises-ra8cwg

# View logs
flyctl logs -a infamous-freight-enterprises-ra8cwg

# Open in browser
flyctl open -a infamous-freight-enterprises-ra8cwg
```

## 📊 Monitoring

```bash
# View metrics
flyctl metrics -a infamous-freight-enterprises-ra8cwg

# Scale up/down
flyctl scale count 2 -a infamous-freight-enterprises-ra8cwg

# Scale VM size
flyctl scale vm shared-cpu-2x -a infamous-freight-enterprises-ra8cwg
```

## 🔄 Update Deployment

```bash
# After making changes
git add .
git commit -m "feat: update web frontend"
git push

# Manual deploy
flyctl deploy --config fly.web.toml --dockerfile Dockerfile.web
```

## 🌐 Custom Domain (Optional)

```bash
# Add custom domain
flyctl certs add yourdomain.com -a infamous-freight-enterprises-ra8cwg

# Add DNS record (example for Cloudflare):
# Type: CNAME
# Name: @ or www
# Value: infamous-freight-enterprises-ra8cwg.fly.dev
```

## 🐛 Troubleshooting

### Build Fails

```bash
# Test Docker build locally
docker build -f Dockerfile.web -t web-test .

# Check logs
flyctl logs -a infamous-freight-enterprises-ra8cwg
```

### App Won't Start

```bash
# SSH into machine
flyctl ssh console -a infamous-freight-enterprises-ra8cwg

# Check Next.js build output
ls -la /app/web/.next/
```

### Can't Connect to API

```bash
# Verify API is running
curl https://infamous-freight-api.fly.dev/api/health

# Check environment variables
flyctl secrets list -a infamous-freight-enterprises-ra8cwg

# Update API URL if needed
flyctl secrets set NEXT_PUBLIC_API_URL="https://infamous-freight-api.fly.dev" \
  -a infamous-freight-enterprises-ra8cwg
```

## 📝 Configuration Files

- **[fly.web.toml](fly.web.toml)** - Fly.io configuration for web
- **[Dockerfile.web](Dockerfile.web)** - Docker build for Next.js
- **[web/next.config.mjs](web/next.config.mjs)** - Next.js config with standalone output

## ✅ Deployment Checklist

- [ ] API deployed and healthy
- [ ] Environment variables set
- [ ] Dockerfile.web created
- [ ] fly.web.toml configured
- [ ] next.config.mjs has `output: 'standalone'`
- [ ] Deploy successful
- [ ] Health check passing
- [ ] Can access frontend
- [ ] Frontend connects to API
- [ ] DNS configured (if using custom domain)

---

**Your web app will be available at:**
https://infamous-freight-enterprises-ra8cwg.fly.dev
