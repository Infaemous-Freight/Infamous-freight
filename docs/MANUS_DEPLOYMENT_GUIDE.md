# Infæmous Freight – Manus Deployment Guide

**Status:** ✅ Production Ready  
**Date:** March 31, 2026  
**Platform:** Manus  
**Region:** US

---

## 🚀 Deployment Overview

This guide covers end-to-end deployment of Infæmous Freight on Manus infrastructure.

### Included Components
- **Backend API:** Express.js 4 + TypeScript with production endpoints
- **Frontend:** React 19 + Vite
- **Database:** PostgreSQL with Prisma models
- **Billing:** Stripe integration with webhook handling
- **Security:** Tenant isolation, RBAC, authentication
- **Monitoring:** Health checks, logging, metrics, alerting

---

## 📋 Pre-Deployment Checklist

### Environment Variables (Manus Secrets)
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `JWT_SECRET`
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
- `SENTRY_DSN` *(optional)*

### Stripe Configuration
1. Create or open your Stripe account.
2. Add webhook endpoint:  
   `https://app.infamousfreight.com/api/billing/webhook/stripe`
3. Select required billing/subscription webhook events.
4. Copy webhook secret into Manus secrets as `STRIPE_WEBHOOK_SECRET`.
5. Validate with Stripe CLI.

### Domain Configuration
- Register/configure `app.infamousfreight.com` (or Manus subdomain)
- Configure DNS records
- Enable SSL certificate
- Confirm CDN settings

### Database Setup
1. Create a PostgreSQL instance in Manus.
2. Run Prisma migrations (`pnpm db:push` or production migration flow).
3. Verify schema objects are present.
4. Validate API-to-DB connectivity.

### Security Review
- Review CORS allow-list/origins
- Confirm rate limiting is active
- Validate authentication middleware
- Confirm tenant isolation in all tenant-scoped queries
- Ensure audit logging is enabled

---

## 🔧 Deployment Steps

1. **Initialize Manus Project** in Manus dashboard/CLI.
2. **Upload Code** from the production branch.
3. **Configure Environment** variables and secrets.
4. **Run Migrations** against the production PostgreSQL instance.
5. **Build Applications** (API + frontend).
6. **Deploy to Manus** and monitor startup logs.
7. **Verify Deployment** with health and smoke tests.

---

## 🧪 Post-Deployment Verification

### Health Checks
- Backend health endpoint returns `200`
- Frontend loads successfully
- Database connectivity verified
- Stripe webhook reachable/configured
- SSL certificate valid
- CORS headers correct

### Functional Tests
- User sign-up works
- User login works
- Dashboard loads with expected data
- Pricing tiers render correctly
- Stripe checkout works
- Subscription creation works
- Usage metering records actions
- Alerts trigger correctly

### Performance Tests
- API response time < 500ms
- Frontend load time < 2s
- Database queries < 100ms
- Rate limiting behaves as configured
- Error handling and fallback responses work

### Security Tests
- Tenant isolation enforced
- Authentication required on protected routes
- CORS policy correct
- Rate limiting active
- Audit logging active
- No sensitive values in logs

---

## 📊 Monitoring & Alerts

### Key Metrics
- API latency (p50/p95/p99)
- API error rate (4xx/5xx)
- DB connection pool + query latency
- Webhook success/failure rates
- Auth failures and suspicious access patterns
- Infrastructure saturation (CPU/memory/disk/network)

### Monitoring Setup
- Configure Manus observability dashboards
- Add alert policies for error spikes/latency regressions
- Route alerts to on-call channel
- Validate synthetic health checks

---

## 🚨 Troubleshooting

### Database Connection Failed
**Symptoms:** widespread 500 responses  
**Actions:**
1. Verify `DATABASE_URL` in Manus secrets
2. Confirm database is online
3. Verify SSL mode/connection parameters
4. Test DB connection manually from runtime environment

### Stripe Webhook Not Firing
**Symptoms:** subscriptions/payments not provisioning  
**Actions:**
1. Verify Stripe webhook endpoint URL
2. Verify `STRIPE_WEBHOOK_SECRET` in Manus secrets
3. Test with Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```
4. Inspect webhook logs for signature/validation failures

### Frontend Not Loading
**Symptoms:** 404 or failed app shell load  
**Actions:**
1. Confirm frontend build artifact exists
2. Review build logs for failed assets
3. Verify API URL configuration (`VITE_API_URL`)
4. Purge/refresh CDN cache if needed

### High Error Rate
**Symptoms:** repeated API 500 responses  
**Actions:**
1. Review application/runtime logs
2. Re-check database connectivity and migrations
3. Confirm rate limiting is not misconfigured
4. Review recent deployments and roll back if necessary

---

## 📈 Scaling & Optimization

### Auto-Scaling
- Configure horizontal scaling based on CPU and latency
- Set safe min/max instance bounds
- Validate startup/readiness probes

### Database Optimization
- Add/verify indexes for high-frequency queries
- Monitor slow query logs
- Tune pool settings and statement timeouts

### CDN Configuration
- Cache static assets
- Set TTL (e.g., 1 hour baseline)
- Enable gzip/brotli compression
- Enable HTTP/2/HTTP/3 where available

---

## 🎯 Success Metrics

### Month 1
- 99.9% uptime
- < 1% error rate
- 10 paying customers
- $2,500 MRR
- 5% churn

### Month 3
- 99.95% uptime
- < 0.5% error rate
- 30 paying customers
- $7,500 MRR
- 3% churn

### Month 6
- 99.99% uptime
- < 0.1% error rate
- 75 paying customers
- $18,750 MRR
- 2% churn

---

## 📞 Support & Escalation

### Escalation Path
1. Check logs and metrics
2. Review recent config/code changes
3. Contact Manus support
4. Trigger incident response process

### Contacts
- Manus Support: <https://help.manus.im>
- Manus Status Page: <https://status.manus.im>
- Manus Documentation: <https://docs.manus.im>

---

## ✅ Final Launch Checklist
- Backend code ready
- Frontend code ready
- Database schema ready
- Stripe integration ready
- Environment variables/secrets prepared
- Security hardening complete
- Tests passed
- Documentation complete
- Deploy to Manus
- Run post-deployment verification
- Monitor for first 24 hours
- Celebrate launch 🎉
