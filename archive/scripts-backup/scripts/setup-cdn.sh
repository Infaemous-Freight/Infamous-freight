#!/bin/bash
# Cloudflare CDN Setup Script
# Automatically configure CDN for static assets and API caching
# Expected: 90% cache hit rate, 50% bandwidth savings

set -e

echo "🌐 Setting up Cloudflare CDN"

# Configuration
DOMAIN="${DOMAIN:-infamousfreight.com}"
CLOUDFLARE_ZONE_ID="${CLOUDFLARE_ZONE_ID}"
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}"
API_ORIGIN="${API_ORIGIN:-https://infamous-freight-api.fly.dev}"
WEB_ORIGIN="${WEB_ORIGIN:-https://infamous-freight-enterprises.vercel.app}"

# Validate environment variables
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN not set"
  echo "Get token from: https://dash.cloudflare.com/profile/api-tokens"
  exit 1
fi

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo "❌ CLOUDFLARE_ZONE_ID not set"
  echo "Find zone ID in Cloudflare dashboard > Overview"
  exit 1
fi

echo "✓ Environment validated"

# Cloudflare API base URL
CF_API="https://api.cloudflare.com/client/v4"

# Function to call Cloudflare API
cf_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  curl -s -X "$method" \
    "${CF_API}${endpoint}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    ${data:+-d "$data"}
}

echo ""
echo "📋 Configuring DNS records..."

# Add DNS records
cf_api POST "/zones/${CLOUDFLARE_ZONE_ID}/dns_records" '{
  "type": "CNAME",
  "name": "api",
  "content": "infamous-freight-api.fly.dev",
  "proxied": true,
  "ttl": 1
}' > /dev/null 2>&1 || echo "⚠️ API record may already exist"

cf_api POST "/zones/${CLOUDFLARE_ZONE_ID}/dns_records" '{
  "type": "CNAME",
  "name": "www",
  "content": "infamous-freight-enterprises.vercel.app",
  "proxied": true,
  "ttl": 1
}' > /dev/null 2>&1 || echo "⚠️ WWW record may already exist"

echo "✓ DNS records configured"

echo ""
echo "⚙️ Configuring cache rules..."

# Page Rules for caching
cf_api POST "/zones/${CLOUDFLARE_ZONE_ID}/pagerules" '{
  "targets": [
    {
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "*'$DOMAIN'/_next/static/*"
      }
    }
  ],
  "actions": [
    {"id": "cache_level", "value": "cache_everything"},
    {"id": "edge_cache_ttl", "value": 31536000}
  ],
  "priority": 1,
  "status": "active"
}' > /dev/null 2>&1 || echo "⚠️ Static assets rule may already exist"

cf_api POST "/zones/${CLOUDFLARE_ZONE_ID}/pagerules" '{
  "targets": [
    {
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "*api.'$DOMAIN'/api/health"
      }
    }
  ],
  "actions": [
    {"id": "cache_level", "value": "cache_everything"},
    {"id": "edge_cache_ttl", "value": 60}
  ],
  "priority": 2,
  "status": "active"
}' > /dev/null 2>&1 || echo "⚠️ Health endpoint rule may already exist"

echo "✓ Cache rules configured"

echo ""
echo "🔧 Configuring performance settings..."

# Enable optimization features
cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/settings/minify" '{
  "value": {
    "css": "on",
    "html": "on",
    "js": "on"
  }
}' > /dev/null

cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/settings/brotli" '{
  "value": "on"
}' > /dev/null

cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/settings/http2" '{
  "value": "on"
}' > /dev/null

cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/settings/http3" '{
  "value": "on"
}' > /dev/null

cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/settings/0rtt" '{
  "value": "on"
}' > /dev/null

cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/settings/early_hints" '{
  "value": "on"
}' > /dev/null

echo "✓ Performance settings enabled"

echo ""
echo "🔒 Configuring security settings..."

# Enable security features
cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/settings/ssl" '{
  "value": "full"
}' > /dev/null

cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/settings/always_use_https" '{
  "value": "on"
}' > /dev/null

cf_api PATCH "/zones/${CLOUDFLARE_ZONE_ID}/settings/automatic_https_rewrites" '{
  "value": "on"
}' > /dev/null

echo "✓ Security settings enabled"

echo ""
echo "✅ Cloudflare CDN setup complete!"
echo ""
echo "🌍 Your site is now served through Cloudflare's global network"
echo ""
echo "📊 Verify setup:"
echo "   1. Visit: https://$DOMAIN"
echo "   2. Check headers for 'cf-cache-status'"
echo "   3. Run: curl -I https://$DOMAIN"
echo ""

# Generate cache configuration for API
cat > /tmp/cloudflare-cache-config.ts << 'EOF'
/**
 * Cloudflare Cache Headers Configuration
 * Add to API responses to control CDN caching
 */

import { Response } from 'express';

/**
 * Cache control settings
 */
export const CacheConfig = {
  // Static assets (1 year)
  STATIC: 'public, max-age=31536000, immutable',
  
  // API responses (5 minutes)
  API: 'public, max-age=300, s-maxage=300',
  
  // Health checks (1 minute)
  HEALTH: 'public, max-age=60, s-maxage=60',
  
  // No cache
  NO_CACHE: 'no-store, no-cache, must-revalidate',
  
  // Private (user-specific)
  PRIVATE: 'private, max-age=0, must-revalidate',
};

/**
 * Set cache headers on response
 */
export function setCacheHeaders(res: Response, cacheControl: string): void {
  res.set('Cache-Control', cacheControl);
  res.set('CDN-Cache-Control', cacheControl);
  res.set('Cloudflare-CDN-Cache-Control', cacheControl);
}

/**
 * Cache middleware for specific routes
 */
export function cacheMiddleware(duration: number) {
  return (req, res, next) => {
    setCacheHeaders(res, `public, max-age=${duration}, s-maxage=${duration}`);
    next();
  };
}

/**
 * Usage:
 * 
 * // In routes
 * router.get('/api/shipments', 
 *   cacheMiddleware(300),  // Cache for 5 minutes
 *   async (req, res) => {
 *     const shipments = await getShipments();
 *     res.json(shipments);
 *   }
 * );
 * 
 * // Manual control
 * router.get('/api/user', async (req, res) => {
 *   setCacheHeaders(res, CacheConfig.PRIVATE);
 *   res.json(userData);
 * });
 */
EOF

echo "📄 Cache configuration generated: /tmp/cloudflare-cache-config.ts"
echo ""

# Create monitoring script
cat > /tmp/monitor-cdn.sh << 'EOF'
#!/bin/bash
# Monitor CDN performance and cache hit rate

DOMAIN="${DOMAIN:-infamousfreight.com}"

echo "📊 CDN Performance Monitor"
echo "=========================="
echo ""

# Test cache status
echo "Testing cache status..."
CACHE_STATUS=$(curl -sI "https://$DOMAIN" | grep -i "cf-cache-status" | cut -d' ' -f2)
echo "Cache Status: $CACHE_STATUS"

# Test response time
echo ""
echo "Testing response time..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' "https://$DOMAIN")
echo "Response Time: ${RESPONSE_TIME}s"

# Get analytics from Cloudflare
echo ""
echo "Fetching CDN analytics..."
curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/analytics/dashboard" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" | \
  jq '.result.timeseries[0] | {
    requests: .requests.all,
    bandwidth: .bandwidth.all,
    threats: .threats.all,
    cached: .requests.cached,
    uncached: .requests.uncached
  }'

echo ""
echo "✓ Monitoring complete"
EOF

chmod +x /tmp/monitor-cdn.sh
echo "📄 Monitoring script generated: /tmp/monitor-cdn.sh"
echo ""

echo "🎯 Expected benefits:"
echo "   - 90% cache hit rate"
echo "   - 50% bandwidth savings"
echo "   - Faster page loads globally"
echo "   - DDoS protection"
echo "   - Automatic SSL/TLS"
echo ""
echo "📖 Cloudflare Dashboard: https://dash.cloudflare.com/$CLOUDFLARE_ZONE_ID"
