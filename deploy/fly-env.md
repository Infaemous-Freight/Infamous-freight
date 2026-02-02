# Fly.io API Environment Variables

DATABASE_URL=postgres://user:pass@fly.db.internal:5432/infamous_freight
JWT_SECRET=generate_a_secret

# AI Providers

AI_PROVIDER=synthetic
AI_SYNTHETIC_API_KEY=
AI_SYNTHETIC_ENGINE_URL=<https://your-fly-app.internal/ai-sim>
AI_SECURITY_MODE=strict

# Billing

STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_SECRET=

# Voice / Uploads

WHISPER_API_KEY=

> Tip: `fly pg create --name infamous-freight-db --region iad` then `fly pg attach` to auto inject `DATABASE_URL`.
