# Provisional Website & Business Audit — Infamous Freight

> **Status:** Provisional draft generated without verified live-page access to `infamousfreight.com`.
> Replace placeholders such as `[city]`, `[state]`, `[MC/DOT number]`, and `[phone]` with verified details.

## 1) Likely Business Summary

Based on the name **Infamous Freight**, the business appears positioned in freight, trucking, transportation, logistics, dispatching, or brokerage.

A strong website in this category should immediately answer:

1. What freight services do you provide?
2. Who do you serve (shippers, carriers, owner-operators, brokers, businesses)?
3. Why should someone trust you with freight?
4. How can someone get a quote, call, book, or partner?

Recommended positioning examples:

- “Reliable freight solutions with bold execution, clear communication, and on-time delivery.”
- “Freight handled with precision, speed, and accountability.”

## 2) Key Business Information to Display

- Business name: **Infamous Freight**
- Industry: freight/logistics/trucking/dispatch/brokerage
- Primary customers: shippers, carriers, owner-operators, businesses
- Main CTA: “Request a Quote”, “Book a Load”, or “Partner With Us”
- Phone number in header/footer/contact and mobile sticky CTA
- Branded email (example: `dispatch@infamousfreight.com`)
- Service areas (city/state/region/nationwide)
- Authority/compliance info (MC, DOT, insurance, licensing)
- Trust signals (testimonials, carrier network, years in business, delivery stats)
- Services offered (FTL, PTL, reefer, flatbed, dispatch, expedited, etc.)
- Short, high-conversion quote form
- Legal pages (privacy and terms)

## 3) Messaging Guidance

Avoid vague copy. Emphasize confidence and execution.

Recommended hero:

- **H1:** Freight Solutions Built for Speed, Reliability, and Accountability
- **Subheadline:** Infamous Freight helps businesses, carriers, and shipping partners move freight with clear communication, dependable coordination, and service you can count on.
- **CTA:** Request a Quote
- **Secondary CTA:** Call Now

## 4) Homepage/Services/About/Contact Copy Drafts

### Homepage

**Freight That Moves With Purpose**

Infamous Freight coordinates reliable freight solutions for businesses that need loads handled with care, urgency, and accountability.

CTAs:
- Request a Quote
- Speak With Our Team

### Services blocks

- Freight Coordination
- Carrier Support
- Expedited Freight
- Truckload and Partial Load Solutions

### About

Infamous Freight was built to deliver logistics support focused on reliability, communication, and execution.

### Contact form fields (recommended)

- Name
- Company
- Phone
- Email
- Pickup location
- Delivery location
- Freight type
- Weight
- Dimensions
- Pickup date
- Delivery deadline
- Additional notes

## 5) SEO Recommendations

- Title: `Infamous Freight | Reliable Freight & Logistics Solutions`
- Alternative local title: `Infamous Freight | Freight & Logistics Services in [City, State]`
- Meta description aligned to freight/logistics intent
- One H1 per page; H2/H3 for sections
- Separate pages for shippers and carriers

Keyword groups:

- Core: freight company, logistics company, freight services, trucking services
- Local: freight company in [city], logistics company in [state]
- Service: full truckload, partial truckload, expedited, reefer, flatbed, hotshot

## 6) Recommended Sitemap

1. Home
2. About
3. Services
4. Shippers
5. Carriers
6. Service Areas
7. Request a Quote
8. Contact
9. Blog/Resources
10. Privacy Policy
11. Terms and Conditions

## 7) Technical SEO Checklist

- HTTPS enabled
- XML sitemap submitted
- Robots.txt reviewed
- Unique metadata per page
- Internal linking to quote/contact paths
- Descriptive alt text
- Mobile-first CTA usability
- Analytics and conversion tracking enabled

## 8) Local SEO Priorities

- Google Business Profile optimization
- Real service-area landing pages with unique localized copy
- No duplicate “fake city” pages

## 9) Schema Markup (placeholder)

Use `LocalBusiness` schema with verified contact and area served details only. Avoid fake address data.

## 10) Positioning Against Competitor Types

Compete with:
- National brokers (win on responsiveness and personal service)
- Local carriers (win on coordination flexibility)
- Digital platforms (win on human communication and accountability)

## 11) Conversion Improvements

- Sticky mobile CTA (`Call Now`, `Request Quote`)
- Quote CTA repeated in key sections
- Trust proof near CTA (authority IDs, testimonials, insurance/compliance where valid)
- “How it works” 4-step visual flow

## 12) Recommended Homepage Sequence

1. Header with phone + quote CTA
2. Hero + value proposition
3. Trust bar
4. Services
5. Why choose us
6. Shipper section
7. Carrier section
8. How it works
9. Service areas
10. Testimonials
11. Final CTA
12. Footer/legal/contact

## 13) Content Marketing Plan (starter topics)

- Choosing a reliable freight partner
- FTL vs LTL basics
- Freight quote prep checklist
- Reducing delays with better coordination
- Expedited freight use cases

## 14) Legal/Trust Constraints

Avoid unsupported claims like “guaranteed cheapest” or “no delays ever.”
Use defensible language: “competitive,” “reliable,” “clear communication,” “timely-focused.”

## 15) Priority Execution Plan

### Immediate

1. Clarify homepage headline
2. Add header quote/call CTA
3. Add verified phone/email in header/footer
4. Expand services page
5. Add verified trust/compliance signals
6. Improve metadata
7. Improve mobile speed + conversion UX
8. Add quote form
9. Add local SEO details
10. Add privacy + terms

### Next phase

1. Dedicated shipper/carrier pages
2. Location pages for real service areas
3. Structured data
4. SEO content cadence
5. Review collection and display
6. Conversion analytics and call tracking

## 16) Recommended Brand Message + CTA

- Brand message: “Infamous Freight provides dependable freight and logistics support for businesses and carriers that need clear communication, flexible solutions, and reliable execution.”
- Primary CTA: **Request a Freight Quote**
- Secondary CTA: **Partner With Us**
- Mobile CTA: **Call Now**

---

## Verification note

This document intentionally avoids claiming live-site findings because the source website content was not verified in this environment.

## 17) Execution status (2026-05-26)

To address review feedback to "do all recommended," the repository and deployment-adjacent checks were executed where possible.

### Completed in this environment

- `pnpm install --frozen-lockfile` ✅
- `pnpm run env:check:frontend` ✅
- `pnpm run env:check:supabase-client` ✅
- `pnpm run build` ✅
- `curl -i https://infamous-freight-api.fly.dev/api/health/live` ✅ (HTTP 200)

### Blocked by environment tooling

- `flyctl config validate --config fly.toml` ⚠️ blocked (`flyctl: command not found`)
- `flyctl checks list -a infamous-freight-api` ⚠️ blocked (`flyctl: command not found`)

### Run on authenticated operator terminal

```bash
flyctl auth whoami
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api
```

If Fly checks fail, follow liveness/readiness separation:

- `/api/health/live` should remain `200` while process is alive.
- `/api/health` can return `503` when dependencies degrade.
- If live endpoint returns fallback mode, inspect logs for missing secrets, database errors, and auth/JWT misconfiguration.
