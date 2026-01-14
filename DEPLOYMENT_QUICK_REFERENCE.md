# 🚀 DEPLOYMENT QUICK REFERENCE

## One-Line Deployment Commands

```bash
# 1. Deploy to Fly.io
flyctl deploy --remote-only

# 2. Set all secrets at once
flyctl secrets set STRIPE_SECRET_KEY="sk_live_..." STRIPE_PUBLISHABLE_KEY="pk_live_..." STRIPE_WEBHOOK_SECRET="whsec_..." PAYPAL_CLIENT_ID="..." PAYPAL_CLIENT_SECRET="..." JWT_SECRET="$(openssl rand -base64 32)" DATABASE_URL="postgresql://..."

# 3. Run migrations
flyctl ssh console -C "cd /app/api && pnpm prisma migrate deploy"

# 4. Check status
flyctl status

# 5. View logs
flyctl logs --recent

# 6. Test API
curl https://infamous-freight-enterprises.fly.dev/health
```

---

## API Endpoints (Live)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/billing/payment-intent` | Create payment intent |
| POST | `/api/billing/confirm-payment` | Confirm payment |
| POST | `/api/billing/subscribe` | Create subscription |
| GET | `/api/billing/revenue` | Revenue metrics |
| GET | `/api/billing/transactions` | Payment history |
| POST | `/api/billing/webhook` | Stripe webhook |
| GET | `/health` | Health check |

---

## Required API Keys

| Key | Format | Where to Find |
|-----|--------|---------------|
| STRIPE_SECRET_KEY | `sk_live_...` | https://dashboard.stripe.com/apikeys |
| STRIPE_PUBLISHABLE_KEY | `pk_live_...` | https://dashboard.stripe.com/apikeys |
| STRIPE_WEBHOOK_SECRET | `whsec_...` | https://dashboard.stripe.com/webhooks |
| PAYPAL_CLIENT_ID | UUID format | https://developer.paypal.com/dashboard/ |
| PAYPAL_CLIENT_SECRET | Long string | https://developer.paypal.com/dashboard/ |
| DATABASE_URL | `postgresql://...` | Your database provider |
| JWT_SECRET | 32+ char random | Generate with: `openssl rand -base64 32` |

---

## Webhook URLs to Register

| Provider | URL |
|----------|-----|
| Stripe | `https://infamous-freight-enterprises.fly.dev/api/billing/webhook` |
| PayPal | `https://infamous-freight-enterprises.fly.dev/api/billing/paypal-webhook` |

---

## Test Card for Stripe

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
Name: Any name (e.g., Test User)
```

---

## Common Issues & Fixes

### flyctl: command not found
```bash
export PATH="$HOME/.fly/bin:$PATH"
```

### Not authenticated
```bash
flyctl auth login
# Or use token:
export FLY_API_TOKEN="your-token-here"
```

### Build fails
```bash
# Check Dockerfile.api exists
ls -la Dockerfile.api

# View build logs
flyctl logs --recent
```

### Health checks failing
```bash
# SSH into machine
flyctl ssh console

# Check if API is running
curl http://localhost:3001/health
```

### Database connection error
```bash
# Verify DATABASE_URL
flyctl secrets list

# Reconnect database
flyctl secrets set DATABASE_URL="postgresql://..."
```

---

## Monitoring Commands

```bash
# Overall status
flyctl status

# Recent logs
flyctl logs --recent

# Follow logs (live)
flyctl logs --follow

# View metrics
flyctl monitor

# SSH to machine
flyctl ssh console

# Scale machines
flyctl scale count 3

# List machines
flyctl machines list

# Restart all machines
flyctl machines restart
```

---

## Revenue Tracking

```bash
# Get daily revenue
curl "https://infamous-freight-enterprises.fly.dev/api/billing/revenue?period=day" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get monthly revenue
curl "https://infamous-freight-enterprises.fly.dev/api/billing/revenue?period=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get yearly revenue
curl "https://infamous-freight-enterprises.fly.dev/api/billing/revenue?period=year" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get all transactions
curl "https://infamous-freight-enterprises.fly.dev/api/billing/transactions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Production Checklist

- [ ] Logged in to Fly.io
- [ ] API deployed successfully
- [ ] All secrets configured
- [ ] Database migrations completed
- [ ] Stripe webhooks registered
- [ ] PayPal webhooks registered
- [ ] Test payment successful
- [ ] Production Stripe keys configured
- [ ] Production PayPal keys configured
- [ ] Monitoring active
- [ ] Error tracking (Sentry) configured
- [ ] Backups enabled

---

## URLs

| Service | URL |
|---------|-----|
| **API** | `https://infamous-freight-enterprises.fly.dev` |
| **API Docs** | `https://infamous-freight-enterprises.fly.dev/api/docs` |
| **Web App** | `https://infamous-freight-enterprises-git-*.vercel.app` |
| **Fly.io Dashboard** | `https://fly.io/dashboard/personal/apps/infamous-freight-enterprises` |
| **Stripe Dashboard** | `https://dashboard.stripe.com` |
| **PayPal Dashboard** | `https://developer.paypal.com/dashboard/` |

---

## Revenue Model

| Plan | Price | Shipments | Users | Storage | Support |
|------|-------|-----------|-------|---------|---------|
| FREE | $0 | 5 | 1 | 1GB | Community |
| STARTER | $29/mo | 100 | 3 | 50GB | Email |
| PROFESSIONAL | $99/mo | 1,000 | 10 | 500GB | Priority |
| ENTERPRISE | $499/mo | Unlimited | Unlimited | 10TB | 24/7 Phone |

---

**Last Updated**: January 14, 2026  
**Status**: ✅ Ready for Production  
**Next Step**: Run the deployment commands above
