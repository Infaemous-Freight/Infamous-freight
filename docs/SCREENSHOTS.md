# Screenshot Checklist

Use this checklist to keep repository visuals accurate, current, and safe for public presentation.

## Required screenshot rules

- Do not include real customer, driver, carrier, billing, shipment, phone, email, or address data.
- Use controlled demo or sanitized seed data only.
- Capture from the canonical production-style UI, not an unfinished local debug state.
- Keep browser chrome minimal unless the URL bar is intentionally part of the proof.
- Prefer PNG for product UI screenshots.
- Store screenshots under `docs/screenshots/`.

## Priority screenshots

| Priority | View | Target file | Notes |
| --- | --- | --- | --- |
| 1 | Landing page | `docs/screenshots/landing-page.png` | First public trust asset. |
| 2 | Quote request | `docs/screenshots/quote-request.png` | Shows customer intake. |
| 3 | Shipment tracking | `docs/screenshots/tracking-page.png` | Shows public shipment visibility. |
| 4 | Pricing/billing | `docs/screenshots/pricing-billing.png` | Shows monetization path. |
| 5 | Operator dashboard | `docs/screenshots/operator-dashboard.png` | Must clearly label demo-backed data if applicable. |
| 6 | Dispatch board | `docs/screenshots/dispatch-board.png` | Do not imply production dispatch execution until live. |
| 7 | Load board | `docs/screenshots/load-board.png` | Use sanitized data. |
| 8 | Driver operations | `docs/screenshots/driver-ops.png` | Use sanitized driver records. |
| 9 | Invoices | `docs/screenshots/billing-invoice.png` | Do not show real billing information. |
| 10 | Analytics dashboard | `docs/screenshots/analytics-dashboard.png` | Label demo-backed metrics if applicable. |
| 11 | Compliance panel | `docs/screenshots/compliance-panel.png` | Use non-sensitive example compliance records. |

## Capture checklist

For each screenshot, record:

- source URL or route
- environment used
- date captured
- commit SHA if available
- whether data is live, demo, or sanitized
- reviewer initials/name

## Naming convention

Use lowercase kebab-case:

```text
docs/screenshots/landing-page.png
docs/screenshots/quote-request.png
docs/screenshots/tracking-page.png
docs/screenshots/operator-dashboard.png
```

## README usage

Only embed images in the README after the file exists in the repository. Avoid placeholder image paths that render as broken images on GitHub.

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
