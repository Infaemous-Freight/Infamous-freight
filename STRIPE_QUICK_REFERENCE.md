# Stripe 100% - Quick Reference Card

## 🚀 Deploy in 5 Steps

```bash
# 1. Run deployment script
bash deploy-stripe.sh

# 2. You'll be asked for:
#    - Stripe Secret Key (from dashboard)
#    - Stripe Publishable Key
#    - Webhook Secret
#    - Price IDs (Pro + Enterprise)

# 3. Database migration
cd api && pnpm prisma migrate dev --name "add_stripe_tables"

# 4. Deploy API
pnpm api:build
pnpm deploy:api

# 5. Deploy Web (Frontend)
pnpm web:build
pnpm deploy:web
```

## 💰 Revenue Model

| Tier | Price | Monthly | Annual |
|------|-------|---------|--------|
| **Free** | $0 | 0 | 0 |
| **Pro** | $99 | $99 | $1,188 |
| **Enterprise** | $999 | $999 | $11,988 |

**100 Paying Customers Example:**

- 80 Pro @ $99 = $7,920/month
- 20 Enterprise @ $999 = $19,980/month
- **Total: $27,900/month = $334,800/year**

All goes to your bank account. ✅

## 🔑 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/billing/subscribe` | Start subscription |
| `GET` | `/api/billing/payments` | Payment history |
| `POST` | `/api/billing/usage-charge` | Usage-based billing |
| `POST` | `/api/billing/webhook` | Stripe webhooks |

## 🧪 Test Payment

Use card: `4242 4242 4242 4242`

- Expiry: Any future date
- CVC: Any 3 digits
- Cost: $0 (auto-refunded)

## 📊 Monitoring

**Check payments in Stripe:**
<https://stripe.com/dashboard/payments>

**Check balance:**
<https://stripe.com/dashboard/balances>

**Payout schedule:**

- Default: Weekly to your bank
- Next payout: Visible in dashboard

## ❌ Troubleshooting

**Webhook not receiving events?**

```bash
# Test locally
stripe listen --forward-to localhost:4000/api/billing/webhook
```

**Payment declined?**

- Check if card is 3D Secure
- Use test card: 4242 4242 4242 4242
- Never reuse real cards for testing

**Funds not showing in bank?**

- Stripe holds for 24-48h on new accounts
- Check "Payouts" section for schedule
- First payout may take 5-7 business days

## 🎯 Success Checklist

- [ ] Stripe account created
- [ ] Bank account connected
- [ ] API keys in `.env`
- [ ] Products created in Stripe
- [ ] Webhook configured
- [ ] Database migrations run
- [ ] Code deployed (API + Web)
- [ ] Test payment successful
- [ ] Payment appears in Stripe dashboard
- [ ] **Payout scheduled to bank account**

---

**You're making money. 🎉**
