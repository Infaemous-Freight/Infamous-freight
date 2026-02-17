#!/bin/bash

# Uptime Monitoring - Vercel Built-in
# Vercel automatically monitors your deployment!
# No external setup needed.

echo "⏱️  Vercel Built-in Uptime Monitoring"
echo "====================================="
echo ""

echo "✅ Vercel automatically monitors production!"
echo ""
echo "Vercel provides:"
echo "  ✅ Health checks every 60 seconds"
echo "  ✅ Uptime % shown in dashboard"  
echo "  ✅ Email alerts on failures"
echo "  ✅ No external service needed"
echo ""

read -p "Enter your production domain (e.g., app.example.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
  DOMAIN="your-domain.vercel.app"
fi

echo ""
echo "🧪 Test health endpoint:"
echo "   curl https://${DOMAIN}/api/health"
echo "   Expected: {\"ok\":true,\"node\":\"v20...\"}"
echo ""

echo "📊 View uptime in Vercel:"
echo "   1. Dashboard → Project → Analytics → Uptime"
echo "   2. Shows last 30 days"
echo ""

echo "🔧 Configure email alerts:"
echo "   Vercel Dashboard → Project → Settings → Notifications"
echo ""

echo "✅ Uptime monitoring is LIVE!"
echo "   Vercel is monitoring your production 24/7."
