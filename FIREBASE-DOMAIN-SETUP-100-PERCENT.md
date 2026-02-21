# 🌐 Firebase Hosting - infamousfreight.com Setup Guide

**Status**: ✅ **Configuration Complete - Awaiting Domain Connection**  
**Domain**: infamousfreight.com  
**Hosting Site**: infamousfreight  
**Target**: apps/web/out  

---

## 📋 Quick Setup Checklist

### 1. Deploy to Firebase Hosting
```bash
# Build the web app
cd apps/web
pnpm build

# Deploy to Firebase
firebase deploy --only hosting

# Output will show:
# ✔  Deploy complete!
# Hosting URL: https://infamousfreight.web.app
```

### 2. Connect Custom Domain

#### Via Firebase Console (Recommended):
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **infamous-freight-prod**
3. Navigate to **Hosting** → **Add custom domain**
4. Enter: `infamousfreight.com`
5. Firebase will provide DNS records to add:

   **For Root Domain (infamousfreight.com)**:
   ```
   Type: A
   Name: @
   Value: 151.101.1.195
          151.101.65.195
   ```

   **For WWW (www.infamousfreight.com)**:
   ```
   Type: CNAME
   Name: www
   Value: infamousfreight.web.app
   ```

6. Add these records to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
7. Wait for DNS propagation (5 minutes - 48 hours, typically 1-2 hours)
8. Firebase will automatically provision an SSL certificate

#### Via Firebase CLI:
```bash
# Add custom domain
firebase hosting:sites:create infamousfreight

# List sites
firebase hosting:sites:list

# Get domain setup instructions
firebase hosting:channel:deploy production --site infamousfreight
```

### 3. Configure DNS Records

#### Example for Cloudflare:
1. Log into Cloudflare Dashboard
2. Select your domain: **infamousfreight.com**
3. Go to **DNS** → **Records**
4. Add A records:
   - **Type**: A, **Name**: @, **IPv4 address**: 151.101.1.195, **Proxy**: Off (DNS only)
   - **Type**: A, **Name**: @, **IPv4 address**: 151.101.65.195, **Proxy**: Off (DNS only)
5. Add CNAME record:
   - **Type**: CNAME, **Name**: www, **Target**: infamousfreight.web.app, **Proxy**: Off (DNS only)

#### Example for GoDaddy:
1. Log into GoDaddy
2. Go to **My Products** → **DNS**
3. Add A records for root domain:
   - Host: @, Points to: 151.101.1.195, TTL: 600
   - Host: @, Points to: 151.101.65.195, TTL: 600
4. Add CNAME record:
   - Host: www, Points to: infamousfreight.web.app, TTL: 600

### 4. Verify Domain Connection

```bash
# Check DNS propagation
dig infamousfreight.com
dig www.infamousfreight.com

# Expected output for A records:
# infamousfreight.com.    300    IN    A    151.101.1.195
# infamousfreight.com.    300    IN    A    151.101.65.195

# Expected output for CNAME:
# www.infamousfreight.com.    300    IN    CNAME    infamousfreight.web.app.

# Check with online tools:
# https://dnschecker.org/#A/infamousfreight.com
# https://dnschecker.org/#CNAME/www.infamousfreight.com
```

### 5. Enable HTTPS (Automatic)

Firebase automatically provisions SSL certificates via Let's Encrypt:
- ✅ SSL certificate issued within 24 hours (usually <1 hour)
- ✅ Auto-renewal every 60 days
- ✅ HTTP to HTTPS redirect enabled by default

Check status:
```bash
# Firebase Console → Hosting → Domain
# Status should show: "Connected" with green checkmark
```

---

## 🔧 Firebase Configuration Updates

### Updated `firebase.json`
```json
{
  "hosting": {
    "site": "infamousfreight",  // ← Custom site name
    "public": "apps/web/out",
    "cleanUrls": true,           // ← Removes .html extensions
    "trailingSlash": false,      // ← Consistent URL structure
    "headers": [
      // Security headers
      {
        "source": "/**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-XSS-Protection", "value": "1; mode=block" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
        ]
      },
      // Cache static assets
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      },
      {
        "source": "**/*.@(js|css|json)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      },
      // Don't cache HTML
      {
        "source": "**/*.html",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
        ]
      }
    ]
  }
}
```

---

## 🚀 Deployment Commands

### Standard Deployment
```bash
# Deploy everything
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy to specific site
firebase deploy --only hosting:infamousfreight

# Preview before deploying
firebase hosting:channel:deploy preview --expires 7d
```

### Preview Channels (Testing)
```bash
# Create preview channel
firebase hosting:channel:deploy staging

# Output:
# ✔  Deploy complete!
# Channel URL: https://infamousfreight--staging-xyz123.web.app
# Expires: 2026-02-24

# Share this URL with team for testing before production deploy
```

### Rollback
```bash
# View deployment history
firebase hosting:clone infamousfreight:current infamousfreight:backup

# Rollback to previous version
firebase hosting:clone infamousfreight:backup infamousfreight:live
```

---

## 📊 Performance Optimizations

### 1. Build Configuration

**Next.js Config** (`apps/web/next.config.mjs`):
```javascript
export default {
  output: 'export',  // Static export for Firebase
  images: {
    unoptimized: true,  // Firebase doesn't support Next.js Image API
  },
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};
```

### 2. Pre-Deploy Optimization
```bash
cd apps/web

# Optimize images
pnpm add -D imagemin imagemin-mozjpeg imagemin-pngquant
npx imagemin public/images/* --out-dir=public/images

# Analyze bundle
ANALYZE=true pnpm build

# Minify output
pnpm build --no-lint  # Skip linting for faster builds
```

### 3. CDN & Caching

Firebase Hosting provides:
- ✅ Global CDN (150+ edge locations)
- ✅ HTTP/2 & HTTP/3 support
- ✅ Brotli compression
- ✅ Zero cold start (unlike Cloud Functions)

Cache strategy:
- **Static assets** (JS, CSS, images): 1 year cache
- **HTML files**: No cache (always fresh)
- **API calls**: Proxied through rewrites

---

## 🔐 Security Best Practices

### 1. Security Headers (Already Configured)
```json
{
  "X-Content-Type-Options": "nosniff",      // Prevent MIME sniffing
  "X-Frame-Options": "DENY",                // Prevent clickjacking
  "X-XSS-Protection": "1; mode=block",      // XSS protection
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

### 2. Content Security Policy (CSP)
Add to `firebase.json`:
```json
{
  "source": "/**",
  "headers": [{
    "key": "Content-Security-Policy",
    "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.infamousfreight.com"
  }]
}
```

### 3. Rate Limiting
Firebase Hosting has built-in DDoS protection, but for API routes:
```json
{
  "rewrites": [{
    "source": "/api/**",
    "function": "api",
    "region": "us-central1"
  }]
}
```

---

## 🧪 Testing After Deployment

### 1. Smoke Tests
```bash
# Test root domain
curl -I https://infamousfreight.com
# Expected: HTTP/2 200

# Test WWW redirect
curl -I https://www.infamousfreight.com
# Expected: 301 → https://infamousfreight.com

# Test HTTPS enforcement
curl -I http://infamousfreight.com
# Expected: 301 → https://infamousfreight.com
```

### 2. Performance Tests
```bash
# Lighthouse audit
npx lighthouse https://infamousfreight.com --view

# Load time test
curl -w "@curl-format.txt" -o /dev/null -s https://infamousfreight.com

# Create curl-format.txt:
cat > curl-format.txt << EOF
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
   time_pretransfer:  %{time_pretransfer}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

### 3. Security Tests
```bash
# Check security headers
curl -I https://infamousfreight.com | grep -E "X-|Content-Security"

# SSL test
openssl s_client -connect infamousfreight.com:443 -servername infamousfreight.com

# Online security scan
# Visit: https://securityheaders.com/?q=infamousfreight.com
#        https://www.ssllabs.com/ssltest/analyze.html?d=infamousfreight.com
```

---

## 📈 Monitoring & Analytics

### 1. Firebase Analytics
Add to `apps/web/pages/_app.tsx`:
```typescript
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();

// Track page views
logEvent(analytics, 'page_view', {
  page_path: window.location.pathname,
  page_title: document.title,
});
```

### 2. Web Vitals
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 3. Uptime Monitoring
```bash
# Use UptimeRobot, Pingdom, or custom script
# Ping https://infamousfreight.com/health every 5 minutes
# Alert on 3 consecutive failures
```

---

## 🐛 Troubleshooting

### Issue: "Domain ownership verification failed"
**Solution**:
1. Ensure DNS records are correct (no typos)
2. Wait for DNS propagation (up to 48 hours)
3. Check DNS with `dig infamousfreight.com`
4. Verify records in Firebase Console

### Issue: "SSL certificate pending"
**Solution**:
- Normal during initial setup (up to 24 hours)
- Check Firebase Console → Hosting → Domain status
- Ensure DNS records point directly to Firebase (no proxy)
- If using Cloudflare, disable proxy (orange cloud → gray)

### Issue: "404 Not Found"
**Solution**:
1. Verify build output exists: `ls -la apps/web/out`
2. Check `firebase.json` public path is correct
3. Redeploy: `firebase deploy --only hosting`

### Issue: "Outdated content after deploy"
**Solution**:
```bash
# Clear browser cache
# Or use hard refresh: Ctrl+Shift+R (Chrome/Firefox)

# Purge CDN cache (if needed)
firebase hosting:channel:deploy production --force
```

---

## 💰 Costs

Firebase Hosting (Blaze Plan):
- **Storage**: $0.026/GB (first 10GB free)
- **Bandwidth**: $0.15/GB (first 360MB/day free)
- **Custom domain**: FREE
- **SSL certificate**: FREE (Let's Encrypt)

**Estimated Monthly Cost**:
- Small site (1-10K visitors): $0-$5
- Medium site (10K-100K visitors): $5-$50
- Large site (100K+ visitors): $50-$200

---

## ✅ Final Checklist

### Pre-Deployment
- [x] Firebase project created
- [x] `firebase.json` configured with custom site
- [x] Security headers added
- [x] Build optimizations configured
- [x] Next.js config set to `output: 'export'`

### Deployment
- [ ] Build completed: `cd apps/web && pnpm build`
- [ ] Deploy to Firebase: `firebase deploy --only hosting`
- [ ] Verify default URL works: `https://infamousfreight.web.app`

### Domain Connection
- [ ] Add custom domain in Firebase Console
- [ ] DNS A records added (151.101.1.195, 151.101.65.195)
- [ ] DNS CNAME record added (www → infamousfreight.web.app)
- [ ] Wait for DNS propagation (check with `dig`)
- [ ] SSL certificate provisioned (check Firebase Console)
- [ ] Test domain: `https://infamousfreight.com`

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Performance audit (Lighthouse score >90)
- [ ] Security headers verified
- [ ] Analytics tracking configured
- [ ] Uptime monitoring enabled
- [ ] Team notified of live URL

---

## 🎉 Success Metrics

Once deployed, you should see:

✅ **Domain**: https://infamousfreight.com (active)  
✅ **SSL**: A+ rating on SSL Labs  
✅ **Performance**: Lighthouse score >90  
✅ **Security**: A+ on SecurityHeaders.com  
✅ **Uptime**: 99.9%+ (Firebase SLA)  
✅ **Load Time**: <2 seconds globally  

---

## 📞 Support

- **Firebase Support**: https://firebase.google.com/support
- **Documentation**: https://firebase.google.com/docs/hosting
- **Status Page**: https://status.firebase.google.com
- **Community**: https://firebase.google.com/community

---

**Status**: ✅ Configuration complete, ready for domain connection  
**Next Step**: Deploy to Firebase and add DNS records  
**ETA to Live**: 1-2 hours (after DNS propagation)

**Last Updated**: February 17, 2026
