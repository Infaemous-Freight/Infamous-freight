# 🚀 Railway Quick Reference

**Essential Railway Commands for Infamous Freight**

## Authentication

```bash
railway login                  # Login with browser
railway logout                 # Logout
railway whoami                 # Show current user
```

## Project Management

```bash
railway create [name]          # Create new project
railway list                   # List all projects
railway project                # Show current project
railway project [id]           # Switch to project
railway project select         # Interactive selection
railway delete [project-id]    # Delete project
```

## Services

```bash
railway service list           # List all services
railway add [service]          # Add service (postgresql, redis, etc.)
railway service logs [name]    # View service logs
railway service logs -f        # Follow logs in real-time
railway service restart [name] # Restart service
railway service remove [name]  # Delete service
railway connect [service]      # SSH/Connect to service
```

## Environment Management

```bash
railway environment            # Show current environment
railway environment [name]     # Switch environment
railway env list               # List all environments
railway env [name]             # Create new environment
railway env delete [name]      # Delete environment
```

## Environment Variables

```bash
railway variable list          # Show all variables
railway variable get [key]     # Get single variable
railway variable set [k] [v]   # Set variable
railway variable delete [key]  # Delete variable

# Examples:
railway variable set DATABASE_URL "postgresql://..."
railway variable set NODE_ENV production
railway variable set JWT_SECRET "$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"
```

## Deployment

```bash
railway up                     # Deploy current service
railway up -d Dockerfile.api   # Deploy specific dockerfile
railway deployment list        # Show deployments
railway deployment logs        # View deployment logs
railway deployment logs -f     # Follow logs
railway deployment cancel      # Cancel current deploy
railway restart                # Restart current service
```

## Monitoring

```bash
railway metrics                # Show CPU/Memory usage
railway status                 # Service status
railway logs                   # Combined logs from all services
```

## Local Development

```bash
railway run [command]          # Run command with Railway env
railway run npm start          # Run npm script with env

# Example:
railway run pnpm dev           # Run dev server with Railway vars
```

## Database Operations

```bash
railway connect postgresql     # Connect to PostgreSQL shell
railway database backups       # List database backups
railway database backup        # Create manual backup
railway database restore [id]  # Restore from backup
```

## Helpful Combinations

```bash
# Deploy and watch logs
railway up && railway deployment logs -f

# Get service URL and health check
railway variable get RAILWAY_PUBLIC_DOMAIN && \
  curl https://$(railway variable get RAILWAY_PUBLIC_DOMAIN)/api/health

# Backup database before major change
railway database backup && \
  railway deployment logs -f

# Switch environment and deploy
railway environment production && railway up -d Dockerfile.api

# View all environment variables (for debugging)
railway variable list | grep -E "DATABASE|REDIS|SECRET"
```

## Useful Links

- **Dashboard**: https://railway.app
- **Documentation**: https://docs.railway.app
- **Discord Community**: https://discord.gg/railway
- **Status Page**: https://status.railway.app

## Troubleshooting Commands

```bash
# Check service is running
railway service logs api --tail 50

# View recent deployments
railway deployment list --limit 5

# Get detailed service info
railway service show api

# Clear Railway cache (requires reload)
railway auth:logout && railway auth:login

# Verify environment variables
railway variable list | grep -v "^$"

# Test database connection
railway connect postgresql
# Then in postgres shell:
# \dt  (list tables)
# SELECT 1;  (test query)
# \q  (exit)

# Monitor in real-time
watch -n 5 'railway metrics'
```

## Environment Variables Needed

**Minimum for API**:
```bash
railway variable set NODE_ENV=production
railway variable set PORT=3001
railway variable set JWT_SECRET="[generate-with-crypto]"
railway variable set DATABASE_URL="[auto-set-from-postgres]"
railway variable set REDIS_URL="[auto-set-from-redis]"
```

**Minimum for Web**:
```bash
railway variable set NODE_ENV=production
railway variable set PORT=3000
railway variable set NEXT_PUBLIC_ENV=production
railway variable set NEXT_PUBLIC_API_BASE_URL="https://[api-url]/api"
```

## FAQ

**Q: How do I see deployment logs?**  
A: `railway deployment logs --follow`

**Q: How do I connect to my database?**  
A: `railway connect postgresql`

**Q: How do I redeploy?**  
A: `railway up` or push to GitHub for auto-deploy

**Q: How do I add a custom domain?**  
A: Dashboard → Service → Settings → Add Custom Domain

**Q: Where are my DATABASE_URL and REDIS_URL?**  
A: Auto-generated when services added. View with: `railway variable list`

**Q: How much does Railway cost?**  
A: ~$5 base + $10 for compute + $10 database = ~$25/month starter

**Q: Can I migrate from Fly.io/Heroku?**  
A: Yes! See: `scripts/railway-migrate.sh`

---

**Pro Tip**: Save this as a shell alias:
```bash
alias rw='railway'
rw project              # Instead of: railway project
rw service logs api -f  # Instead of: railway service logs api --follow
```

**Last Updated**: February 3, 2026
