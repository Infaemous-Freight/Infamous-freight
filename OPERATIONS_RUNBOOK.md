# 📚 Operations Runbooks - Infamous Freight Enterprises

## Table of Contents
1. [Daily Operations](#daily-operations)
2. [Deployment Procedures](#deployment-procedures)
3. [Performance Monitoring](#performance-monitoring)
4. [Incident Response](#incident-response)
5. [Scaling & Optimization](#scaling--optimization)

---

## Daily Operations

### Morning Checklist (Start of Day)

```bash
# 1. Check deployment status
curl -s https://vercel.com/api/v13/deployments \
  -H "Authorization: Bearer $VERCEL_TOKEN" | jq '.deployments[0]'

# 2. Verify cache hit rates
bash web/scripts/monitor-build-performance.sh

# 3. Check Web Vitals
curl -s https://web-vitals-api.vercel.app/metrics

# 4. Review error logs
tail -n 100 /var/log/infamous-freight/app.log | grep ERROR

# 5. Check infrastructure health
bash web/scripts/verify-deployment.sh
```

### Weekly Checklist (Every Monday)

```bash
# 1. Run dependency audit
bash web/scripts/review-dependencies.sh

# 2. Analyze bundle size
bash web/scripts/audit-bundle-size.sh

# 3. Review performance trends
# Check: https://vercel.com/dashboard/analytics

# 4. Audit security
npm audit --audit-level=moderate

# 5. Check certificate expiration
curl -I https://infamous-freight.vercel.app | grep -i "expires"
```

### Monthly Checklist (1st of Month)

```bash
# 1. Generate comprehensive report
bash web/scripts/performance-dashboard.sh

# 2. Cost analysis
# Review: https://vercel.com/dashboard/usage

# 3. Dependency updates
pnpm update --interactive

# 4. Security review
# Check: GitHub Security tab

# 5. Performance optimization
# Analyze: Lighthouse CI results
```

---

## Deployment Procedures

### Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Code reviewed and approved
- [ ] Performance impact assessed
- [ ] Security scan completed
- [ ] Changelog updated
- [ ] Rollback plan prepared

### Deployment Steps

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes and test
# ... implement feature ...

# 3. Run validation
cd web && bash scripts/validate-build.sh

# 4. Run bundle check
bash scripts/audit-bundle-size.sh

# 5. Commit with meaningful message
git commit -m "feat: description of changes

- Detail 1
- Detail 2"

# 6. Push and create PR
git push origin feature/your-feature

# 7. Monitor CI/CD
# Check: GitHub Actions > Lighthouse CI

# 8. Merge after approval
git merge feature/your-feature

# 9. Monitor Vercel deployment
# Check: https://vercel.com/deployments
```

### Post-Deployment Checklist

- [ ] Deployment successful on Vercel
- [ ] Analytics showing traffic
- [ ] No increase in error rates
- [ ] Performance metrics stable
- [ ] User feedback positive
- [ ] Document any issues

---

## Performance Monitoring

### Real-Time Monitoring

```bash
# Terminal 1: Watch build metrics
watch -n 60 'bash web/scripts/monitor-build-performance.sh'

# Terminal 2: Stream error logs
tail -f /var/log/infamous-freight/app.log

# Terminal 3: Monitor cache performance
watch -n 30 'curl -s https://vercel.com/api/metrics | jq .cache'
```

### Performance Degradation Response

If performance drops:

```bash
# 1. Identify the issue
bash web/scripts/audit-bundle-size.sh
bash web/scripts/review-dependencies.sh

# 2. Check recent deployments
git log --oneline -10

# 3. Review error logs
grep -i "error\|warning" /var/log/infamous-freight/app.log

# 4. Check infrastructure
# Vercel dashboard > Project > Analytics

# 5. Possible solutions
# - Rollback: git revert <commit>
# - Optimize: purge cache, rebuild
# - Scale: increase resources
```

---

## Incident Response

### Incident Severity Levels

**Level 1 (Critical)**: Entire service down
**Level 2 (High)**: Major functionality broken
**Level 3 (Medium)**: Degraded performance
**Level 4 (Low)**: Minor issue

### Critical Incident (Level 1)

```bash
# 1. IMMEDIATE: Page SRE team
# Contact info in 1password

# 2. Assess impact
curl -I https://infamous-freight.vercel.app

# 3. Identify root cause
# Check: Vercel dashboard, GitHub Actions, error logs

# 4. Rollback if needed
git revert HEAD~1
git push origin main

# 5. Communicate status
# Update incident channel in Slack

# 6. Investigate root cause
# Post-incident review in 2-4 hours

# 7. Update status page
# https://status.infamous-freight.com
```

### High Incident (Level 2)

```bash
# 1. Alert team immediately
# Slack: #incidents channel

# 2. Create incident ticket
# Jira: New ticket with priority HIGH

# 3. Start investigating
bash web/scripts/verify-deployment.sh

# 4. Plan remediation
# Timeline: within 1 hour

# 5. Execute fix
# Deploy fix, monitor for 30 minutes

# 6. Postmortem
# Schedule for next day
```

---

## Scaling & Optimization

### When to Scale

```bash
# Check current usage
curl -s https://vercel.com/api/usage | jq '.buildMinutes'

# If approaching limits:
# 1. Review .vercelignore - exclude more files
# 2. Optimize images - convert to AVIF
# 3. Split code - increase chunk sizes
# 4. Consider upgrade - Pro/Enterprise plan
```

### Optimization Procedures

```bash
# 1. Bundle analysis
bash web/scripts/audit-bundle-size.sh

# 2. Identify heavy packages
pnpm why <package-name>

# 3. Replace with alternatives
# Example: moment → day.js (2KB vs 70KB)

# 4. Dynamic imports for large components
import dynamic from 'next/dynamic'
const HeavyComponent = dynamic(() => import('./Heavy'), { ssr: false })

# 5. Rebuild and verify
pnpm build

# 6. Monitor impact
bash web/scripts/monitor-build-performance.sh
```

---

## Useful Commands

### Build & Deployment
```bash
pnpm install              # Install dependencies
pnpm build               # Build project
pnpm dev                 # Start dev server
pnpm lint                # Lint code
pnpm format              # Format code
```

### Monitoring & Analysis
```bash
bash scripts/validate-build.sh              # Pre-build checks
bash scripts/monitor-build-performance.sh   # Build metrics
bash scripts/audit-bundle-size.sh          # Bundle analysis
bash scripts/review-dependencies.sh        # Dependency audit
bash scripts/verify-deployment.sh          # Deployment checks
```

### Git Commands
```bash
git log --oneline -20                      # Recent commits
git diff HEAD^ HEAD                        # Compare with previous
git bisect start                           # Find problematic commit
git tag -l                                 # List versions
```

### Vercel CLI
```bash
vercel login                               # Authenticate
vercel deploy                              # Manual deployment
vercel env ls                              # List env vars
vercel logs <deployment-url>              # Stream logs
vercel rollback                            # Rollback deployment
```

---

## Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| SRE Lead | TBD | TBD | @sre-lead |
| Platform Engineer | TBD | TBD | @platform |
| On-Call | TBD | TBD | @oncall |

---

## References

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Performance Best Practices](../VERCEL_OPTIMIZATION_100_COMPLETE.md)
- [Incident Response Policy](../policies/INCIDENT_RESPONSE.md)

---

**Last Updated**: January 16, 2026  
**Maintained By**: SRE Team  
**Review Frequency**: Quarterly
