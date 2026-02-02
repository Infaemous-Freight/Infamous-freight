#!/bin/bash

# INFAMOUS FREIGHT - LIVE DEPLOYMENT COMPLETION MONITOR
# This script guides you through completing the deployment 100%

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║         🚀 INFAMOUS FREIGHT - LIVE DEPLOYMENT COMPLETION (100%)            ║"
echo "║                                                                            ║"
echo "║              PostgreSQL ✅ | API ⏳ | Web ⏳ | Verification ⏳              ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 1: MONITOR RAILWAY DEPLOYMENT${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat << 'EOF'

📊 WATCH FOR THESE SERVICES TO GO GREEN:

   1. PostgreSQL Service
      Status: Should show ✅ RUNNING (green)
      URL: Will show database connection string
      Time: 2-3 minutes (should already be done)

   2. API Service
      Status: Should show ✅ RUNNING (green)
      URL: Will show public API URL (https://...)
      Time: 5-10 minutes total
      Deploys from: Dockerfile.api

   3. Check Status
      Go to: https://railway.app/dashboard
      Look for: Both services with ✅ green checkmarks
      Logs: Click each service to see deployment logs

EOF

echo ""
echo -e "${YELLOW}⏱️  ESTIMATED TIME REMAINING: 5-10 minutes${NC}"
echo ""
echo -e "${BLUE}ACTION: Open https://railway.app/dashboard in your browser${NC}"
echo -e "${BLUE}        Watch for both services to show green ✅ status${NC}"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 2: ONCE API IS RUNNING - GET THE PUBLIC URL${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat << 'EOF'

Once the API service shows ✅ RUNNING:

   1. Click on the API service in Railway
   2. Go to the "Settings" tab
   3. Look for "Public URL" or "Domain"
   4. It will look like: https://infamous-freight-api.railway.app
   5. COPY this URL to clipboard

EOF

echo ""
echo -e "${YELLOW}⚠️  SAVE THIS URL - YOU'LL NEED IT IN STEP 3!${NC}"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 3: TEST API IS WORKING${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat << 'EOF'

Test that your API is responding:

   Run in terminal (paste your API URL):
   ─────────────────────────────────────────
   curl https://your-railway-api-url/api/health
   
   Expected response:
   {"status":"ok","database":"connected"}

   If you see that, your API is ✅ WORKING!

EOF

echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 4: UPDATE VERCEL ENVIRONMENT${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat << 'EOF'

Now connect the web app to your API:

   1. Go to: https://vercel.com/dashboard
   2. Select project: "Infamous Freight"
   3. Go to: Settings → Environment Variables
   4. Find or create: NEXT_PUBLIC_API_URL
   5. Paste your Railway API URL
   6. Click "Save"
   7. Click "Deployments" tab
   8. Click the latest deployment
   9. Click "Redeploy"

   Wait 2-3 minutes for Vercel to redeploy...

EOF

echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 5: TEST END-TO-END${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat << 'EOF'

Once Vercel redeployment completes, test everything:

   1. Open web app:
      https://infamous-freight-enterprises.vercel.app

   2. Check browser console:
      Press F12 → Console tab
      Should see NO CORS errors
      Should see normal logs

   3. Navigate to login page:
      https://infamous-freight-enterprises.vercel.app/auth/sign-in

   4. Try to log in:
      Use test credentials or attempt login
      Should connect to Railway API

   5. Check dashboard:
      https://infamous-freight-enterprises.vercel.app/dashboard

   6. Verify monitoring:
      Go to: https://sentry.io
      Should see events arriving in real-time

EOF

echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}COMPLETION CHECKLIST${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat << 'EOF'

Mark off each as you complete:

   Deployment:
   [ ] PostgreSQL running on Railway (green status)
   [ ] API running on Railway (green status)
   [ ] API health check responds: {"status":"ok","database":"connected"}

   Configuration:
   [ ] Railway API URL copied
   [ ] Vercel NEXT_PUBLIC_API_URL environment variable set
   [ ] Vercel redeployed successfully

   Testing:
   [ ] Web app loads: https://infamous-freight-enterprises.vercel.app
   [ ] No CORS errors in browser console
   [ ] Login page accessible
   [ ] API health endpoint responds
   [ ] Sentry receiving events

   Result:
   [ ] 🎉 100% LIVE IN PRODUCTION!

EOF

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}FAMOUS SUCCESS INDICATORS${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat << 'EOF'

When all items below are ✅, you're 100% LIVE:

   ✅ APIhealth check: curl returns {"status":"ok","database":"connected"}
   ✅ Web app loads in browser without errors
   ✅ Login flow works end-to-end
   ✅ Sentry dashboard shows incoming events
   ✅ No console errors in browser DevTools
   ✅ Railway shows both services with green status
   ✅ Vercel shows deployment as "Ready"

EOF

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}QUICK REFERENCE - COPY YOUR URLs${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat << 'EOF'

Once you have your Railway API URL, save it here:

   Your Rails API URL (from Railway dashboard):
   ─────────────────────────────────────────────
   [ Paste here after deployment ]

   Web App URL:
   ─────────────────────────────────────────────
   https://infamous-freight-enterprises.vercel.app

   Dashboards:
   ─────────────────────────────────────────────
   Railway:  https://railway.app/dashboard
   Vercel:   https://vercel.com/dashboard
   Sentry:   https://sentry.io
   GitHub:   https://github.com/MrMiless44/Infamous-freight

EOF

echo ""
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                            ║${NC}"
echo -e "${GREEN}║             🚀 YOU'RE ALMOST THERE - JUST 5 MORE STEPS AWAY!               ║${NC}"
echo -e "${GREEN}║                                                                            ║${NC}"
echo -e "${GREEN}║            From now to LIVE: PostgreSQL ✅ → API ⏳ → Web ✅             ║${NC}"
echo -e "${GREEN}║                                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next action: Follow the 5 steps above${NC}"
echo -e "${YELLOW}Expected time: 15-20 minutes TOTAL${NC}"
echo -e "${YELLOW}Result: 100% LIVE production app 🎉${NC}"
echo ""
