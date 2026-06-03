# Screenshot Checklist

Use this checklist to keep repository visuals accurate, current, and safe for public presentation.

## Required screenshot rules

- Do not include real customer, driver, carrier, billing, shipment, phone, email, or address data.
- Use controlled demo or sanitized seed data only.
- Capture from the canonical production-style UI, not an unfinished local debug state.
- Keep browser chrome minimal unless the URL bar is intentionally part of the proof.
- Prefer PNG for product UI screenshots.
- Store screenshots under `docs/screenshots/`.
- Do not fabricate screenshots or use AI-generated UI images as evidence of product readiness.
- Only embed screenshots in `README.md` after the image file exists in the repository.

## Priority screenshots

| Priority | View | Route | Target file | Notes |
| --- | --- | --- | --- | --- |
| 1 | Landing page | `/` | `docs/screenshots/landing-page.png` | First public trust asset. |
| 2 | Quote request | `/request-quote` | `docs/screenshots/quote-request.png` | Shows customer intake. |
| 3 | Shipment tracking | `/track-shipment` | `docs/screenshots/tracking-page.png` | Shows public shipment visibility. |
| 4 | Pricing/billing | `/pricing` or `/billing` | `docs/screenshots/pricing-billing.png` | Shows monetization path without real payment data. |
| 5 | Operator dashboard | `/ops` | `docs/screenshots/operator-dashboard.png` | Must clearly label demo-backed data if applicable. |
| 6 | Dispatch board | `/dispatch` | `docs/screenshots/dispatch-board.png` | Do not imply production dispatch execution until live. |
| 7 | Load board | `/loads` or `/load-board` | `docs/screenshots/load-board.png` | Use sanitized load data. |
| 8 | Driver operations | `/drivers` | `docs/screenshots/driver-ops.png` | Use sanitized driver records. |
| 9 | Invoices | `/invoices` or `/billing` | `docs/screenshots/billing-invoice.png` | Do not show real billing information. |
| 10 | Analytics dashboard | `/analytics` | `docs/screenshots/analytics-dashboard.png` | Label demo-backed metrics if applicable. |
| 11 | Compliance panel | `/compliance` | `docs/screenshots/compliance-panel.png` | Use non-sensitive example compliance records. |
| 12 | Carrier management | `/carriers` | `docs/screenshots/carrier-management.png` | Use sanitized carrier records. |
| 13 | GitHub OAuth login | `/login` | `docs/screenshots/github-oauth-login.png` | Capture only after provider is enabled in the active auth dashboard. |

## Capture checklist

For each screenshot, record:

- source URL or route
- environment used: production, staging, or local production build
- date captured
- commit SHA if available
- whether data is live, demo, or sanitized
- reviewer initials/name
- whether any visible identifiers were checked for privacy

## Recommended local capture flow

Use a production build or the canonical deployed site. Do not capture from a half-broken development page.

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm -C apps/web exec vite preview --host 127.0.0.1 --port 4173
```

Then capture the routes above from:

```text
http://127.0.0.1:4173
```

If screenshots must prove live production, capture from:

```text
https://www.infamousfreight.com
```

## Screenshot manifest

For every screenshot PR, add or update `docs/screenshots/manifest.md` with one row per image:

| File | Route | Environment | Date | Data type | Reviewer | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `docs/screenshots/landing-page.png` | `/` | production | YYYY-MM-DD | public | initials | no sensitive data |

Create the manifest if it does not already exist.

## Naming convention

Use lowercase kebab-case:

```text
docs/screenshots/landing-page.png
docs/screenshots/quote-request.png
docs/screenshots/tracking-page.png
docs/screenshots/operator-dashboard.png
docs/screenshots/dispatch-board.png
docs/screenshots/load-board.png
docs/screenshots/driver-ops.png
docs/screenshots/billing-invoice.png
docs/screenshots/analytics-dashboard.png
docs/screenshots/compliance-panel.png
docs/screenshots/carrier-management.png
docs/screenshots/github-oauth-login.png
```

## README usage

Only embed images in the README after the file exists in the repository. Avoid placeholder image paths that render as broken images on GitHub.

Recommended README block after screenshots exist:

```md
## Platform Screenshots

### Operations Dashboard
![Operations Dashboard](docs/screenshots/operator-dashboard.png)

### Dispatch Board
![Dispatch Board](docs/screenshots/dispatch-board.png)

### Shipment Tracking
![Shipment Tracking](docs/screenshots/tracking-page.png)

### Analytics Dashboard
![Analytics Dashboard](docs/screenshots/analytics-dashboard.png)

### Billing
![Billing](docs/screenshots/billing-invoice.png)
```

## Social preview

The GitHub social preview target is:

```text
.github/social-preview.png
```

Regenerate with:

```bash
pnpm run social-preview:generate
```

Then upload the resulting PNG manually in GitHub under **Settings → General → Social preview**.
