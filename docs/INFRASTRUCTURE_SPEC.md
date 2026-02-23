# Infrastructure Specification

## Production Stack

### Compute
- ECS Fargate Cluster

### Database
- RDS PostgreSQL Multi-AZ
- Read Replica (for analytics)

### Cache
- Redis Elasticache

### Storage
- S3 (documents + backups)

### CDN
- CloudFront

### Firewall
- Cloudflare WAF

### Monitoring
- Datadog
- Sentry

### Backup Policy
- Daily DB snapshots
- 30-day retention
