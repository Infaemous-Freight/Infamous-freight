# Deployment Strategy & Infrastructure

## Blue-Green Deployment (Zero Downtime)

```yaml
# deploy-blue-green.yml
name: Blue-Green Deployment

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Deploy to "green" environment
      - name: Deploy to staging (green)
        run: |
          # Deploy new version to green
          fly deploy -a infamous-freight-api-green

      # Run smoke tests
      - name: Run smoke tests
        run: |
          curl https://infamous-freight-api-green.fly.dev/api/health
          # Run basic tests

      # Switch traffic
      - name: Switch traffic (blue -> green)
        if: success()
        run: |
          # Update DNS/LoadBalancer to point to green
          # Archive old blue environment

      # Rollback if needed
      - name: Rollback on failure
        if: failure()
        run: |
          echo "Rolling back to blue environment"
          # Switch traffic back to blue
```

## Canary Deployment (Gradual Rollout)

```yaml
# deploy-canary.yml
name: Canary Deployment

jobs:
  deploy:
    steps:
      - name: Deploy canary (5% traffic)
        run: fly deploy -a infamous-freight-api --canary 5

      - name: Monitor canary (5 minutes)
        run: |
          # Check error rates, latency
          # If OK, proceed to 25%
          # If NOK, rollback

      - name: Deploy to 25% traffic
        run: fly deploy -a infamous-freight-api --canary 25

      - name: Deploy to 100% traffic
        run: fly deploy -a infamous-freight-api --canary 100
```

## Multi-Region Deployment

```yaml
# Regions: us-east (primary), eu-west (secondary), ap-northeast (tertiary)
# Health checks every 30s
# Automatic failover on 503+ errors
```

## Infrastructure as Code (Terraform)

```hcl
# terraform/main.tf

resource "fly_app" "api" {
  org       = "infamous-freight"
  name      = "infamous-freight-api"
  region    = "pdx"
  internal  = false
  std_gen   = 1

  env = {
    NODE_ENV               = "production"
    LOG_LEVEL              = "info"
    DATABASE_URL           = data.fly_secret.db_url.value
    AUTH_SECRET             = data.fly_secret.auth_token.value
    REDIS_URL              = fly_app.redis.internal_url
  }
}

# Monitoring & Autoscaling
resource "fly_machine" "api_1" {
  app    = fly_app.api.name
  region = "pdx"
  cpus   = 2
  memory = 2048

  config {
    auto_start = true
    auto_stop  = false
    processes = {
      app = {
        cmd = ["node", "src/server.js"]
      }
    }
  }
}
```

## Rollback Strategy

```bash
# If deployment fails or errors spike:

# 1. Revert to previous image
fly images list -a infamous-freight-api
fly deploy -a infamous-freight-api --image sha256:abc123

# 2. Monitor metrics
fly status -a infamous-freight-api

# 3. Check logs
fly logs -a infamous-freight-api -n 100

# 4. If needed, trigger hotfix deployment
git revert HEAD
git push
# CI/CD triggers new deployment
```

## Release Checklist

```markdown
## Pre-Release

- [ ] All tests passing
- [ ] Code review approved
- [ ] Changelog updated
- [ ] Security scan passed
- [ ] Database migrations tested
- [ ] API versioning bumped

## Release

- [ ] Create GitHub release
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor metrics (5 minutes)
- [ ] Notify stakeholders

## Post-Release

- [ ] Monitor error rates (24 hours)
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Update documentation
```

## Monitoring & Alerts

```javascript
// Sentry + Datadog configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  enableTracing: true,
  attachStacktrace: true,
});

// Alert on:
// - Error rate > 1%
// - Response time > 2s (p99)
// - Database connection failures
// - Rate limit exceeded (>100/min)
// - Disk usage > 80%
// - Memory usage > 85%
```
