# Fly.io Deployment Guide

## Why Fly.io?

- ✅ Docker-based (handles monorepos perfectly)
- ✅ Global deployment (available in 30+ regions)
- ✅ Very fast cold starts
- ✅ Built-in SSL/TLS
- ✅ Free tier available

---

## Prerequisites

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"

# Verify installation
flyctl version
```

---

## Step-by-Step Deployment

### Step 1: Authenticate with Fly.io

```bash
flyctl auth login
```

This will:

1. Open browser to <https://fly.io/app/sign-up>
2. Create a new account or sign in
3. Return authorization token to CLI

### Step 2: Create Fly.io App

```bash
cd /workspaces/Infamous-freight-enterprises
flyctl launch --no-deploy
```

When prompted:

- **App Name**: `infamous-freight` (or choose a name)
- **Region**: Select closest to your users (e.g., `iad` for US East)
- **Would you like to tweak these settings before proceeding**: `n`

This creates:

- ✅ `fly.toml` configuration file
- ✅ Dockerfile (auto-generated)
- ✅ Remote app on Fly.io (not yet deployed)

### Step 3: Set Environment Variables

```bash
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

**Get values from:** <https://supabase.com/dashboard> → Settings → API

### Step 4: Deploy to Production

```bash
flyctl deploy --remote-only
```

This will:

1. Build Docker image
2. Push to Fly.io registry
3. Deploy 2 instances globally
4. Auto-scale based on traffic

**First deploy takes 3-5 minutes.**

### Step 5: Get Production URL

```bash
flyctl info
```

Look for:

```
Hostname: infamous-freight.fly.dev
```

Visit: `https://infamous-freight.fly.dev`

---

## Verification

### Check Deployment Status

```bash
flyctl status
```

Should show:

```
✓ app-servers: 2 desired, 2 running, 2 healthy
```

### View Logs

```bash
flyctl logs
```

Should show:

```
2026-02-01T12:00:00Z nodejs app ready on port 3000
```

### Test the App

```bash
flyctl open
# Opens your app in browser
```

---

## Continuous Deployment

### Option A: Deploy via GitHub Actions (Recommended)

Create `.github/workflows/deploy-fly.yml`:

```yaml
name: Deploy to Fly.io
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions@master
        with:
          args: "deploy --remote-only"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Option B: Manual Deploy

After pushing to GitHub:

```bash
flyctl deploy --remote-only
```

---

## Useful Commands

```bash
# View app info
flyctl info

# View logs in real-time
flyctl logs -f

# SSH into running instance
flyctl ssh console

# Scale replicas
flyctl scale count 4  # 4 instances

# Check resource usage
flyctl status

# Redeploy latest image
flyctl deploy --remote-only

# View environment variables
flyctl secrets list

# Update secret
flyctl secrets set KEY=value

# View deployed versions
flyctl releases
```

---

## Troubleshooting

**Build Failed**

- Check logs: `flyctl logs`
- Common issue: Dockerfile references wrong node version
- Solution: Check `Dockerfile` was generated to handle monorepo

**App Won't Start**

- `flyctl logs` to see error
- `flyctl ssh console` to debug inside instance
- Likely: Environment variables not set correctly

**Out of Memory**

- `flyctl scale memory 512`  (increase to 512MB)
- Default is 256MB per instance

**High Latency in Your Region**

- `flyctl regions list`
- `flyctl regions add xxx` to add closer region
- `flyctl scale count 2` in that region

---

## Cost Estimation

**Free tier includes:**

- 3 shared-cpu-1x 256MB VMs
- 10GB egress bandwidth
- Perfect for hobby/testing

**Production pricing (if needed):**

- ~$5.70/month per instance
- Recommended: 2 instances for high availability
- ~$12-15/month total

---

## Next Steps

1. ✅ Deploy to Fly.io (you are here)
2. Optional: Deploy to Vercel too (see VERCEL_GIT_INTEGRATION_GUIDE.md)
3. Set up custom domain (Project → Domains)
4. Enable auto-scaling (Based on CPU/memory)
5. Configure monitoring (Fly.io dashboard)

---

## Important: Dockerfile

Fly.io generates a `Dockerfile` for you. To support pnpm monorepo, ensure it:

```dockerfile
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build only web app
RUN pnpm --filter web build

EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
```

If auto-generated Dockerfile doesn't work, use the above.
