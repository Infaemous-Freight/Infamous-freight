# Deployment Guide

## Overview

This landing page provides quick access to all deployment documentation and runbooks for Infamous Freight Enterprise. The system is deployed across multiple environments and platforms, with comprehensive documentation for each.

## Quick Links

### Deployment Documentation

- **[Deployment Runbook](deployment/DEPLOYMENT_RUNBOOK.md)** - Complete step-by-step deployment procedures
- **[Deployment Guide](deployment/DEPLOYMENT_GUIDE.md)** - High-level deployment strategy and architecture
- **[Quick Deployment](deployment/QUICK_DEPLOYMENT.md)** - Fast-track deployment for experienced operators
- **[Migration Guide](deployment/MIGRATION_GUIDE.md)** - Guide for migrating between environments or versions

### Environment-Specific Guides

- **[Production Overview](deployment/production-overview.md)** - Production environment architecture and operations
- **[Deployment Status](deployment/DEPLOYMENT_STATUS.md)** - Current deployment status and health checks
- **[Environment Status](deployment/DEPLOYMENT_ENVIRONMENT_STATUS.md)** - Status of all environments

### Platform-Specific Deployment

#### API Deployment

- **[Render API Testing](deployment/RENDER_API_TESTING.md)** - API deployment on Render platform
- **[Deploy Action](deployment/DEPLOY_ACTION.md)** - GitHub Actions deployment workflow
- **[Secrets Configuration](deployment/SECRETS_CONFIGURED.md)** - Required secrets and environment variables

#### Web Deployment

- **[Web Deployment on Vercel](deployment/WEB_DEPLOYMENT_VERCEL.md)** - Next.js app deployment to Vercel
- **[Vercel Build Fixes](deployment/VERCEL_BUILD_FIXES.md)** - Common Vercel build issues and solutions
- **[Vercel Analytics Setup](deployment/VERCEL_ANALYTICS_SETUP.md)** - Setting up analytics and monitoring

### Execution Logs and History

- **[Deployment Execution Log](deployment/DEPLOYMENT_EXECUTION_LOG.md)** - Historical deployment execution records
- **[Deployment Complete](deployment/DEPLOYMENT_COMPLETE.md)** - Post-deployment validation checklist
- **[Deployment Summary](deployment/DEPLOYMENT_SUMMARY.md)** - Summary of recent deployments
- **[Session Complete](deployment/DEPLOYMENT_SESSION_COMPLETE.md)** - Deployment session reports

## Deployment Architecture

### Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CDN / Edge Layer                          │
│                   Vercel Edge Network (Web)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Web (Vercel) │  │ API (Render)  │  │ API (Fly.io)  │
│   Next.js 14  │  │   Express.js  │  │   Express.js  │
│   Port 3000   │  │   Port 3001   │  │   Port 4000   │
└───────────────┘  └───────┬───────┘  └───────┬───────┘
                           │                  │
                           └────────┬─────────┘
                                    ↓
                    ┌──────────────────────────┐
                    │   PostgreSQL Database    │
                    │   (Supabase / RDS)       │
                    └──────────────────────────┘
```

### Deployment Targets

| Component     | Platform | Environment | Access                                          |
| ------------- | -------- | ----------- | ----------------------------------------------- |
| Web Dashboard | Vercel   | Production  | <https://infamous-freight-enterprises.vercel.app> |
| API (Primary) | Render   | Production  | <https://infamous-freight-api.onrender.com>       |
| API (Backup)  | Fly.io   | Production  | <https://infamous-freight-api.fly.dev>            |
| Database      | Supabase | Production  | Managed PostgreSQL                              |
| Redis Cache   | Upstash  | Production  | Managed Redis                                   |

## Deployment Workflows

### CI/CD Pipeline

The deployment process is automated through GitHub Actions:

1. **Code Push** → Triggers CI workflow
2. **CI Success** → Triggers CD workflow
3. **CD Workflow** → Deploys to staging, then production
4. **Post-Deployment** → Health checks and smoke tests

### Deployment Sequence

```
Developer → Git Push → CI (Test + Build) → CD Trigger
                                              ↓
                                         Deploy API
                                              ↓
                                         Verify API Health
                                              ↓
                                         Deploy Web
                                              ↓
                                         Verify Web Health
                                              ↓
                                         Post-deployment Checks
                                              ↓
                                         Notify Team
```

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All CI checks passing (tests, lint, type-check)
- [ ] Code reviewed and approved
- [ ] Database migrations tested in staging
- [ ] Environment variables updated if needed
- [ ] Secrets rotated if compromised
- [ ] Rollback plan documented
- [ ] Stakeholders notified of deployment window
- [ ] Monitoring and alerting verified

## Deployment Commands

### Manual Deployment (Emergency Only)

**API Deployment to Render:**

```bash
# From project root
cd apps/api
git push render main
```

**Web Deployment to Vercel:**

```bash
# From project root
cd apps/web
vercel --prod
```

### Automated Deployment (Recommended)

**Trigger via GitHub Actions:**

```bash
# Deploy to production
gh workflow run cd.yml

# Deploy to staging
gh workflow run cd.yml --ref develop
```

## Post-Deployment Verification

### Health Checks

**API Health:**

```bash
curl https://infamous-freight-api.onrender.com/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-12-28T21:00:00Z",
  "version": "1.0.0",
  "database": "connected"
}
```

**Web Health:**

```bash
curl https://infamous-freight-enterprises.vercel.app/
```

Expected: HTTP 200 status code

### Smoke Tests

Run automated smoke tests:

```bash
pnpm test:e2e --grep "@smoke"
```

### Monitoring Dashboards

- **Vercel Dashboard**: <https://vercel.com/dashboard>
- **Render Dashboard**: <https://dashboard.render.com>
- **Uptime Monitor**: Check status of all endpoints
- **Error Tracking**: Sentry dashboard for errors

## Rollback Procedures

### Quick Rollback

**If deployment fails:**

1. **Immediate**: Revert to previous deployment

   ```bash
   # Vercel
   vercel rollback

   # Render
   render rollback infamous-freight-api
   ```

2. **Notify team**: Post in #incidents Slack channel

3. **Investigate**: Review logs and error reports

4. **Fix and redeploy**: Once root cause identified

### Database Rollback

If database migration needs rollback:

```bash
cd apps/api
pnpm prisma migrate resolve --rolled-back <migration-name>
```

## Environment Variables and Secrets

### Required Secrets

All required secrets are documented in [deployment/SECRETS_CONFIGURED.md](deployment/SECRETS_CONFIGURED.md).

**Critical secrets:**

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Authentication token secret
- `VERCEL_TOKEN`: Vercel deployment token
- `RENDER_API_KEY`: Render deployment key

### Managing Secrets

**Update secrets on Vercel:**

```bash
vercel env add SECRET_NAME production
```

**Update secrets on Render:**
Via Render dashboard → Environment → Environment Variables

## Troubleshooting

### Common Issues

**1. Build Failure on Vercel**

- Check [Vercel Build Fixes](deployment/VERCEL_BUILD_FIXES.md)
- Verify all dependencies are in package.json
- Check build logs for specific errors

**2. API Not Starting**

- Verify DATABASE_URL is correct
- Check Prisma client is generated
- Review API logs on Render dashboard

**3. Database Connection Issues**

- Verify database is accessible from deployment platform
- Check connection string format
- Verify IP whitelist includes deployment platform

**4. Environment Variable Issues**

- Verify all required variables are set
- Check for typos in variable names
- Ensure secrets are not exposed in logs

### Getting Help

**Deployment Support:**

- **Slack**: #deployments channel
- **On-call**: Page on-call engineer for P0/P1 incidents
- **Documentation**: Check deployment runbooks for specific issues
- **GitHub Issues**: Create issue with `deployment` label for non-urgent issues

## Monitoring and Alerts

### Key Metrics

- **Response Time**: API latency < 200ms (p95)
- **Error Rate**: < 0.1% of requests
- **Uptime**: 99.9% SLA
- **Database Connections**: < 80% of pool
- **Memory Usage**: < 85% of allocated

### Alert Channels

- **Critical alerts**: PagerDuty → On-call engineer
- **Warning alerts**: Slack #alerts channel
- **Info alerts**: Email to team distribution list

## Maintenance Windows

**Scheduled maintenance:**

- **Weekly**: Sunday 2:00 AM - 4:00 AM UTC (database backups)
- **Monthly**: First Sunday of month, 2:00 AM - 6:00 AM UTC (system updates)

**Emergency maintenance:**

- Coordinated via #incidents Slack channel
- Stakeholders notified via status page

## Additional Resources

### External Documentation

- **Vercel Docs**: <https://vercel.com/docs>
- **Render Docs**: <https://render.com/docs>
- **Prisma Deployment**: <https://www.prisma.io/docs/guides/deployment>
- **Next.js Deployment**: <https://nextjs.org/docs/deployment>

### Internal Resources

- **Architecture Documentation**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **API Reference**: [apps/api/API_REFERENCE.md](apps/api/API_REFERENCE.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
- **Security Guide**: [security.md](security.md)

---

**Last Updated:** December 28, 2025  
**Maintained By:** DevOps Team  
**Questions?** Contact <devops@infamousfreight.com>
