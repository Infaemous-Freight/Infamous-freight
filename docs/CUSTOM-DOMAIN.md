# Infamous Freight — Custom Domain Setup

This guide walks you through pointing your custom domain to the
Infamous Freight platform.

---

## What You Need

- A domain name (e.g., `infamousfreight.com`)
- Access to your domain's DNS settings
  (GoDaddy, Cloudflare, Namecheap, etc.)

---

## Step 1: DNS Records

Add these DNS records at your domain registrar:

### For the Web App (Netlify)

|Type|Name|Value|TTL|
|---|---|---|---|
|A|`@`|`75.2.60.5`|Auto|
|CNAME|`www`|`infamousfreight.netlify.app`|Auto|

> Remove any old or conflicting `@` and `www` records so only the records
> above remain active.

### For the API (Fly.io)

|Type|Name|Value|TTL|
|---|---|---|---|
|CNAME|`api`|`infamous-freight.fly.dev`|Auto|

This gives you:

- **Web (canonical):** `https://www.infamousfreight.com`
- **Web (redirect):** `https://infamousfreight.com` →
  `https://www.infamousfreight.com`
- **API:** `https://api.infamousfreight.com`

---

## Step 2: Netlify Custom Domain

1. Go to your Netlify dashboard: `https://app.netlify.com/projects/infamousfreight`
2. Click **Add custom domain**
3. Enter: `infamousfreight.com`
4. Click **Verify** → **Add domain**
5. Also add `www.infamousfreight.com` so Netlify provisions an SSL
   certificate for it
6. Netlify will request an SSL certificate automatically (HTTPS)

### Primary Domain

Set `www.infamousfreight.com` as the primary domain and keep the apex as a
domain alias:

1. In Netlify **Domain management → Production domains**, ensure both
   domains are present:
   - `www.infamousfreight.com`
   - `infamousfreight.com`
2. Click **Set as primary** on `www.infamousfreight.com`
3. Leave `infamousfreight.com` as the secondary alias so traffic can be
   redirected to the canonical `www` host

---

## Step 3: Fly.io Custom Domain

1. Go to your Fly.io dashboard: `https://fly.io/apps/infamous-freight`
2. Click **Certificates**
3. Click **Add certificate**
4. Enter: `api.infamousfreight.com`
5. Fly.io will verify your DNS CNAME and provision SSL

Or via CLI:

```bash
fly certs create api.infamousfreight.com --app infamous-freight
```

---

## Step 4: Update Frontend API URL

Once your API subdomain is live, update the frontend to use it:

### `apps/web/.env.production`

```env
VITE_API_URL=https://api.infamousfreight.com
VITE_SOCKET_URL=wss://api.infamousfreight.com
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### `apps/web/src/api-client/client.ts`

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.infamousfreight.com';
```

---

## Step 5: CORS Configuration

Update your API's CORS settings to accept requests from your custom domain:

### `apps/api/src/main.ts`

```typescript
app.enableCors({
  origin: [
    'https://www.infamousfreight.com',
    'https://infamousfreight.com',
    'http://localhost:5173',
  ],
  credentials: true,
});
```

---

## Step 6: SSL/HTTPS Verification

Test that everything is secure:

```bash
# Test apex -> www redirect (expect 301/308 with Location: https://www.infamousfreight.com/...)
curl -sI https://infamousfreight.com | sed -n '1,6p'

# Test canonical web host
curl -sI https://www.infamousfreight.com | sed -n '1,6p'

# Test API health
curl -s https://api.infamousfreight.com/health

# Test API docs
curl -s https://api.infamousfreight.com/api/docs
```

All should return `200 OK` with valid SSL certificates.

---

## Complete URL Map

|Service|URL|
|---|---|
|**Main App (canonical)**|`https://www.infamousfreight.com`|
|**Main App (redirect)**|`https://infamousfreight.com`|
|**API**|`https://api.infamousfreight.com`|
|**WebSocket**|`wss://api.infamousfreight.com`|
|**Health Check**|`https://api.infamousfreight.com/health`|
|**API Docs**|`https://api.infamousfreight.com/api/docs`|
|**Stripe Webhook**|`https://api.infamousfreight.com/stripe/webhook`|

---

## Cloudflare (Optional but Recommended)

If using Cloudflare as your DNS provider, you get free DDoS protection and caching:

1. Add your domain to Cloudflare
2. Change nameservers at your registrar to Cloudflare's
3. In Cloudflare DNS, add the records from Step 1
4. Set SSL/TLS mode to **Full (strict)**
5. Enable **Always Use HTTPS**
6. Enable **Auto Minify** for JS, CSS, HTML

### Cloudflare Page Rules (Free Performance Boost)

```text
Rule 1: infamousfreight.com/static/*
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month

Rule 2: infamousfreight.com/api/*
  - Cache Level: Bypass
  - Security Level: High
```

---

## Troubleshooting

### "Domain not found"

- DNS propagation takes 5 minutes to 48 hours
- Check: `dig infamousfreight.com +short`

### "SSL certificate error"

- Netlify/Fly.io need time to provision certificates (up to 24 hours)
- Ensure DNS records are correct before requesting certificates

### "CORS error in browser"

- Double-check CORS origin list includes your exact domain
- Include both `www` and non-`www` variants
- Add `http://localhost:5173` for local development

### "API 404 on custom domain"

- Verify Fly.io cert is active: `fly certs show api.infamousfreight.com --app infamous-freight`
- Check DNS CNAME resolves: `dig api.infamousfreight.com +short`
