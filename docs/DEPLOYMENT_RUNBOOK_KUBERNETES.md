# Deployment Runbook: Docker & Kubernetes

## Quick Reference

| Step | Time | Owner | Checklist |
|------|------|-------|-----------|
| Pre-deployment | 30min | DevOps | [ ] Verify all tests pass |
| Build & Push | 15min | DevOps | [ ] Docker images pushed to registry |
| Database | 20min | DBA | [ ] Migrations run, schema verified |
| Deploy API | 10min | DevOps | [ ] Pods rolling out, health checks passing |
| Deploy Web | 10min | DevOps | [ ] CDN cache cleared, deployment verified |
| Verification | 30min | QA | [ ] Smoke tests pass, key endpoints respond |
| Monitoring | 10min | DevOps | [ ] Dashboards loaded, alerts active |

---

## Pre-Deployment

```bash
# 1. Verify all tests pass
git status  # Clean working directory
pnpm test   # All tests passing

# 2. Tag release
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0

# 3. Build Docker images
docker build -t infamous-freight-api:1.0.0 ./apps/api
docker build -t infamous-freight-web:1.0.0 ./apps/web

# 4. Push to registry (e.g., ECR, Docker Hub)
docker tag infamous-freight-api:1.0.0 YOUR_REGISTRY/infamous-freight-api:1.0.0
docker push YOUR_REGISTRY/infamous-freight-api:1.0.0
docker push YOUR_REGISTRY/infamous-freight-web:1.0.0
```

---

## Database Migration (Kubernetes)

```bash
# 1. Run Prisma migration
kubectl exec -it deployment/api -- npx prisma migrate deploy

# 2. Verify schema
kubectl exec -it deployment/api -- npx prisma studio

# 3. Backup (optional)
kubectl exec -it deployment/api -- pg_dump $DATABASE_URL > backup.sql
```

---

## Deploy to Kubernetes

```bash
# 1. Update manifest with new image tags
kubectl set image deployment/api api=YOUR_REGISTRY/infamous-freight-api:1.0.0
kubectl set image deployment/web web=YOUR_REGISTRY/infamous-freight-web:1.0.0

# 2. Monitor rollout
kubectl rollout status deployment/api
kubectl rollout status deployment/web

# 3. Verify replicas
kubectl get pods -l app=api
kubectl get pods -l app=web

# 4. Tail logs
kubectl logs -f deployment/api --tail=100
kubectl logs -f deployment/web --tail=100
```

---

## Smoke Tests

```bash
# 1. API health
curl -s https://api.yourdomain.com/api/health | jq .

# 2. Web homepage
curl -s -I https://yourdomain.com | grep "200 OK"

# 3. Auth endpoint
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' | jq .

# 4. Create shipment (requires valid JWT)
curl -X POST https://api.yourdomain.com/api/shipments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"origin":"NYC","destination":"LAX"}' | jq .
```

---

## Rollback (If Issues)

```bash
# 1. Revert to previous version
kubectl rollout undo deployment/api
kubectl rollout undo deployment/web

# 2. Check status
kubectl rollout status deployment/api
kubectl get pods

# 3. Restore database (if needed)
kubectl exec -it deployment/api -- psql $DATABASE_URL < backup.sql
```

---

## Post-Deployment

```bash
# 1. Verify metrics
# Check Prometheus: https://prometheus.yourdomain.com/graph
# Check Grafana: https://grafana.yourdomain.com

# 2. Check error rates
kubectl logs deployment/api | grep "ERROR\|error" | head -20

# 3. Monitor for 30 minutes
# Watch: Error rate, latency (P50/P95/P99), CPU, memory

# 4. Notify team
# - Update status page
# - Post deployment message
# - Document any issues found
```

---

## Emergency Contacts

- **DevOps Lead**: [name/contact]
- **Database Admin**: [name/contact]
- **On-call Engineer**: Check Slack #oncall
- **Escalation**: [manager/director name]

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Pod stuck in ImagePullBackOff | Check image registry credentials |
| Database migration fails | Check migration files; rollback if necessary |
| High CPU/memory | Check for infinite loops; scale up replicas |
| 5xx errors spiking | Check application logs; rollback if > 1% |

---

**Last Updated**: 2026-01-22  
**Version**: 1.0  
**Status**: Ready for Production
