# Fly.io Build Troubleshooting Guide

## Issues Fixed

### 1. ✅ Missing fly.toml at Project Root

**Problem**: Fly.io expects `fly.toml` at the project root, but it was located in `configs/ci-cd/fly.toml`

**Solution**: Created `/workspaces/Infamous-freight-enterprises/fly.toml` with correct configuration

### 2. ✅ Incorrect Dockerfile Path

**Problem**: Original fly.toml pointed to `apps/api/Dockerfile` which doesn't exist

**Solution**: Created optimized `Dockerfile.fly` at project root that properly handles the monorepo structure

### 3. ✅ Monorepo Build Context

**Problem**: The project uses pnpm workspaces with API at `apps/api/`, requiring special Docker build handling

**Solution**: New Dockerfile properly:

- Installs pnpm in the base image
- Copies workspace configuration files
- Uses `pnpm install --filter infamous-freight-api...` to install only API dependencies
- Generates Prisma client before build
- Uses multi-stage build for smaller production image

## Quick Deploy Steps

1. **Run the helper script**:

   ```bash
   ./scripts/deploy-fly.sh
   ```

2. **Or deploy manually**:

   ```bash
   # Ensure you're logged in
   flyctl auth login

   # Deploy
   flyctl deploy
   ```

## Common Build Errors & Solutions

### Error: "Dockerfile not found"

**Cause**: Fly.io can't find the Dockerfile specified in fly.toml

**Fix**: Ensure `Dockerfile.fly` exists at project root and `fly.toml` references it correctly

### Error: "pnpm: command not found"

**Cause**: Dockerfile doesn't have pnpm installed

**Fix**: Already handled in `Dockerfile.fly` with `corepack enable`

### Error: "Cannot find module 'express'"

**Cause**: Dependencies not properly installed in Docker image

**Fix**: Check that `pnpm install --filter infamous-freight-api...` runs successfully in build stage

### Error: "Prisma Client has not been generated"

**Cause**: Prisma client generation step missing

**Fix**: Already handled with `pnpm run prisma:generate` in builder stage

### Error: "Connection refused at startup"

**Cause**: App trying to connect to database before migrations run

**Fix**:

1. Run migrations after deploy:

   ```bash
   flyctl ssh console -a infamous-freight-api
   cd /app && pnpm run prisma:migrate
   ```

2. Or uncomment the migration line in Dockerfile.fly (not recommended for production)

## Environment Variables Required

Set these on Fly.io before deployment:

```bash
# Required
flyctl secrets set JWT_SECRET=$(openssl rand -base64 32) -a infamous-freight-api
flyctl secrets set DATABASE_URL="<postgres_connection_string>" -a infamous-freight-api

# Optional (set if using these features)
flyctl secrets set STRIPE_SECRET_KEY="<your_stripe_key>" -a infamous-freight-api
flyctl secrets set PAYPAL_CLIENT_ID="<your_paypal_id>" -a infamous-freight-api
flyctl secrets set AI_PROVIDER="synthetic" -a infamous-freight-api
```

## Database Setup

### Create PostgreSQL Database

```bash
# Create database
flyctl pg create --name infamous-freight-db --region iad

# Attach to app (this sets DATABASE_URL automatically)
flyctl pg attach infamous-freight-db -a infamous-freight-api
```

### Run Migrations

```bash
# SSH into the running app
flyctl ssh console -a infamous-freight-api

# Run migrations
cd /app && pnpm run prisma:migrate
```

## Monitoring & Debugging

### View Logs

```bash
# Real-time logs
flyctl logs -a infamous-freight-api

# Recent logs
flyctl logs -a infamous-freight-api --recent
```

### Check App Status

```bash
flyctl status -a infamous-freight-api
```

### View Deployments

```bash
flyctl releases -a infamous-freight-api
```

### SSH Into App

```bash
flyctl ssh console -a infamous-freight-api
```

### Scale Resources

```bash
# Scale memory
flyctl scale memory 2048 -a infamous-freight-api

# Scale VMs
flyctl scale count 2 -a infamous-freight-api
```

## File Structure

```
/
├── fly.toml                  # Fly.io configuration (NEW)
├── Dockerfile.fly            # Optimized Dockerfile (NEW)
├── scripts/
│   └── deploy-fly.sh         # Deployment helper (NEW)
├── src/
│   └── apps/
│       └── apps/api/              # API source code
│           ├── Dockerfile    # Original Dockerfile (still works)
│           ├── package.json
│           ├── prisma/
│           └── src/
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

## Testing Locally

Test the Docker build locally before deploying:

```bash
# Build the image
docker build -f Dockerfile.fly -t infamous-freight-api:test .

# Run it
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="test-secret" \
  -e NODE_ENV="production" \
  infamous-freight-api:test
```

## Rollback

If a deployment fails:

```bash
# List recent releases
flyctl releases -a infamous-freight-api

# Rollback to previous version
flyctl releases rollback <version_number> -a infamous-freight-api
```

## Performance Optimization

### Enable Auto-Scaling

Already configured in `fly.toml`:

- `auto_stop_machines = true`: Stops machines when idle
- `auto_start_machines = true`: Starts on request
- `min_machines_running = 1`: Keep at least one running

### Adjust Resources

```bash
# Current plan: 1GB RAM, 1 shared CPU
# Upgrade if needed:
flyctl scale memory 2048 -a infamous-freight-api
flyctl scale vm dedicated-cpu-1x -a infamous-freight-api
```

## Support Resources

- Fly.io Status: <https://status.flyio.net/>
- Community Forum: <https://community.fly.io/>
- Documentation: <https://fly.io/docs/>

## Verification Checklist

- [ ] fly.toml exists at project root
- [ ] Dockerfile.fly exists at project root
- [ ] flyctl is installed and logged in
- [ ] App is created on Fly.io
- [ ] Database is created and attached
- [ ] Required secrets are set
- [ ] Deployment succeeds
- [ ] Health check endpoint responds: `https://<your-app>.fly.dev/api/health`
- [ ] Logs show no errors

---

**Last Updated**: 2026-01-01
**Status**: ✅ Ready for deployment
