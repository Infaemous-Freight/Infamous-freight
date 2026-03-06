## Release Checklist

### Build integrity
- [ ] lint passes
- [ ] typecheck passes
- [ ] tests pass
- [ ] build succeeds
- [ ] CI pipeline green

Commands verified locally:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Environment verification
- [ ] production environment variables verified
- [ ] staging environment variables verified
- [ ] secrets configured correctly
- [ ] no placeholder credentials
- [ ] external integrations verified

Services checked:
- [ ] database
- [ ] redis / queues
- [ ] sentry
- [ ] storage
- [ ] email / notification provider

### Database migration
- [ ] migration reviewed
- [ ] staging migration executed
- [ ] backup snapshot confirmed
- [ ] rollback plan documented

Migration command:

```bash
pnpm prisma:migrate:deploy
```

### Health checks
- [ ] API health endpoint OK
- [ ] DB connectivity OK
- [ ] Redis connectivity OK
- [ ] background workers healthy
- [ ] auth flow verified
- [ ] core routes tested

Critical flows tested:
- [ ] load board
- [ ] shipment creation
- [ ] shipment tracking
- [ ] carrier matching

### Observability
- [ ] Sentry configured
- [ ] logs visible
- [ ] request metrics visible
- [ ] dashboards healthy

Dashboards checked:
- [ ] error rate
- [ ] latency
- [ ] DB performance
- [ ] queue health

### Rollout plan
- [ ] release owner assigned
- [ ] deployment window scheduled
- [ ] rollout method chosen
- [ ] rollback version identified
- [ ] rollback commands documented

Rollout method:
- [ ] full deploy
- [ ] canary
- [ ] blue/green
- [ ] feature flag release
