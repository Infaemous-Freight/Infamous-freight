#!/bin/bash
# Cost Optimization Guide
# Reduce costs from $11/month to $0-3/month

set -e

echo "💰 Cost Optimization Guide"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Current Setup Costs:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Fly.io Web:      $3/month"
echo "  Fly.io API:      $3/month"
echo "  Postgres:        $5/month"
echo "  ─────────────────────────"
echo "  Total:          $11/month"
echo ""

echo -e "${BLUE}Optimized Setup Costs:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Vercel Web:      FREE ✅"
echo "  Fly.io API:      $0-3/month (free credits)"
echo "  Neon Database:   FREE ✅"
echo "  Upstash Redis:   FREE ✅"
echo "  ─────────────────────────"
echo "  Total:          $0-3/month"
echo ""
echo -e "${GREEN}Savings: $8-11/month (73-100% reduction!)${NC}"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}OPTION 1: Move Web to Vercel (FREE)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Benefits:"
echo "  • Completely free (no monthly cost)"
echo "  • Better Next.js optimization"
echo "  • Automatic deployments"
echo "  • Edge caching"
echo "  • Faster performance"
echo ""
echo "Setup Steps:"
echo ""
echo "  1. Install Vercel CLI:"
echo "     pnpm add -g vercel@latest"
echo ""
echo "  2. Deploy web to Vercel:"
echo "     cd apps/web && vercel --prod"
echo ""
echo "  3. Configure environment variables in Vercel dashboard:"
echo "     NEXT_PUBLIC_API_URL=https://infamous-freight-api.fly.dev"
echo ""
echo "  4. Redeploy to apply env vars:"
echo "     vercel --prod"
echo ""
echo "  5. Update web traffic to new Vercel URL"
echo ""
read -p "Deploy web to Vercel now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd apps/web
    vercel --prod || echo "Deployment may need manual intervention"
    cd ..
    echo -e "${GREEN}✅ Web deployed to Vercel${NC}"
fi
echo ""

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}OPTION 2: Migrate DB to Neon (FREE 512MB)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Benefits:"
echo "  • 512MB free tier (sufficient for most apps)"
echo "  • Serverless Postgres"
echo "  • Auto-scaling"
echo "  • Better for hobby projects"
echo ""
echo "Setup Steps:"
echo ""
echo "  1. Sign up at https://neon.tech"
echo ""
echo "  2. Create new project"
echo "  3. Copy connection string"
echo ""
echo "  4. Update API database secret:"
echo "     flyctl secrets set DATABASE_URL='postgresql://...' --app infamous-freight-api"
echo ""
echo "  5. Restart API:"
echo "     flyctl apps restart infamous-freight-api"
echo ""
echo "  6. Verify migrations still work:"
echo "     flyctl ssh console --app infamous-freight-api -C 'cd apps/api && npx prisma migrate deploy'"
echo ""
echo "  7. Delete Fly.io Postgres:"
echo "     flyctl apps destroy infamous-freight-db"
echo ""
read -p "Migrate to Neon? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Paste Neon connection string: " neon_url
    if [ ! -z "$neon_url" ]; then
        echo "Setting DATABASE_URL..."
        flyctl secrets set DATABASE_URL="$neon_url" --app infamous-freight-api
        
        echo "Restarting API..."
        flyctl apps restart infamous-freight-api
        
        echo "Waiting for API to restart..."
        sleep 10
        
        echo "Running migrations..."
        flyctl ssh console --app infamous-freight-api -C "cd apps/api && npx prisma migrate deploy" || true
        
        echo -e "${GREEN}✅ Database migrated to Neon${NC}"
    fi
fi
echo ""

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}OPTION 3: Use Upstash Redis (FREE)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Benefits:"
echo "  • 10,000 requests/day free"
echo "  • Sufficient for most apps"
echo "  • No infrastructure to manage"
echo ""
echo "Setup Steps:"
echo ""
echo "  1. Sign up at https://upstash.com"
echo ""
echo "  2. Create Redis database"
echo "  3. Copy connection URL (REST or Redis protocol)"
echo ""
echo "  4. Update API Redis secret:"
echo "     flyctl secrets set REDIS_URL='redis://...' --app infamous-freight-api"
echo ""
echo "  5. Restart API:"
echo "     flyctl apps restart infamous-freight-api"
echo ""
read -p "Set up Upstash Redis? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Paste Upstash Redis URL: " upstash_url
    if [ ! -z "$upstash_url" ]; then
        echo "Setting REDIS_URL..."
        flyctl secrets set REDIS_URL="$upstash_url" --app infamous-freight-api
        
        echo "Restarting API..."
        flyctl apps restart infamous-freight-api
        
        echo -e "${GREEN}✅ Redis configured via Upstash${NC}"
    fi
fi
echo ""

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}OPTION 4: Use Free Tier Services${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Other Free Services:"
echo ""
echo "  📊 Sentry"
echo "     • 5,000 errors/month"
echo "     • Sign up: https://sentry.io"
echo ""
echo "  📈 Uptime Robot"
echo "     • 50 monitors"
echo "     • Sign up: https://uptimerobot.com"
echo ""
echo "  🔍 Supabase"
echo "     • 500MB Postgres (alternative to Neon)"
echo "     • Auth included"
echo "     • Sign up: https://supabase.com"
echo ""
echo "  📊 PlanetScale"
echo "     • Free MySQL (if you prefer MySQL)"
echo "     • Sign up: https://planetscale.com"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ COST OPTIMIZATION COMPLETE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Final Summary:"
echo ""
echo "Original Stack ($11/month):"
echo "  ├─ Fly.io Web:       $3"
echo "  ├─ Fly.io API:       $3"
echo "  └─ Postgres:         $5"
echo ""
echo "Optimized Stack ($0-3/month):"
echo "  ├─ Vercel Web:       FREE ✅"
echo "  ├─ Fly.io API:       FREE* ($0-3 with credits)"
echo "  ├─ Neon Database:    FREE ✅"
echo "  ├─ Upstash Redis:    FREE ✅"
echo "  └─ Sentry:           FREE (5K errors) ✅"
echo ""
echo "*Fly.io gives $15 free credits/month to new accounts"
echo ""
echo "💰 You save: $8-11/month (73-100%)"
echo ""
