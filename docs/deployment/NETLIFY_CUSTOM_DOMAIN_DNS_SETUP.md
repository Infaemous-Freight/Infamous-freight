# Netlify Custom Domain DNS Setup (infamousfreight.co)

This runbook configures `infamousfreight.co` and `www.infamousfreight.co` to point to the Netlify site `infamousfreight.netlify.app`.

## 1) Clean up conflicting DNS records

Delete conflicting records for the root and `www` host:

- `A @ -> 104.18.26.246` (Cloudflare)
- `A @ -> 76.76.21.21` (Vercel)
- `A www -> 104.18.26.246`

Keep TXT verification and unrelated records.

## 2) Add the correct Netlify DNS records

### Root domain (`infamousfreight.co`)

- **Type:** `A`
- **Name:** `@`
- **Value:** `75.2.60.5`

### WWW domain (`www.infamousfreight.co`)

- **Type:** `CNAME`
- **Name:** `www`
- **Value:** `infamousfreight.netlify.app`

## 3) Connect the domain in Netlify

In Netlify dashboard:

1. Go to **Domain settings**.
2. Click **Add custom domain**.
3. Enter `infamousfreight.co`.
4. Click **Verify**.
5. Set it as **Primary domain**.

Confirm both domains are active in Netlify:

- `infamousfreight.co`
- `www.infamousfreight.co`

## 4) SSL behavior

Netlify automatically issues SSL certificates after DNS propagation.

Expected timing:

- Usually 5–30 minutes
- Can take up to 24 hours

## 5) Validation checklist

After propagation, verify both URLs serve the Netlify site:

- `https://infamousfreight.co`
- `https://www.infamousfreight.co`

## 6) Target end-state

- `infamousfreight.co` -> Netlify
- `www.infamousfreight.co` -> Netlify
- `app.infamousfreight.com` -> app infrastructure (unchanged)
