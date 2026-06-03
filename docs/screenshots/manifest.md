# Screenshot Manifest

Use this manifest to track every screenshot committed under `docs/screenshots/`.

Do not list planned screenshots here until the actual image file exists in the repository. This file is for evidence-backed assets only.

| File | Route | Environment | Date | Data type | Reviewer | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | Add rows only after real screenshots are captured and privacy-reviewed. |

## Required fields

- **File:** repository path, for example `docs/screenshots/operator-dashboard.png`
- **Route:** source route, for example `/ops`
- **Environment:** production, staging, or local production build
- **Date:** capture date in `YYYY-MM-DD` format
- **Data type:** public, sanitized, demo, or live
- **Reviewer:** initials or name of the person who privacy-reviewed the image
- **Notes:** any caveat, such as "demo-backed metrics" or "no customer data visible"

## Privacy rule

Screenshots must not expose real customer, driver, carrier, shipment, billing, phone, email, address, token, secret, session, or account data.

## README rule

Only embed screenshots in `README.md` after:

1. the PNG exists in `docs/screenshots/`,
2. the row is recorded in this manifest,
3. the image has been privacy-reviewed,
4. the screenshot accurately represents the current product state.
