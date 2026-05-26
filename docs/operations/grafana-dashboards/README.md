# Grafana dashboard definitions

These JSON files are importable dashboard baselines that satisfy production telemetry acceptance criteria.

## Dashboards

- `api-reliability-dashboard.json`
- `dispatch-shipments-dashboard.json`
- `billing-stripe-webhooks-dashboard.json`
- `ai-usage-dashboard.json`

## Import steps

1. Open Grafana → Dashboards → New → Import.
2. Upload one JSON file from this folder.
3. Bind each panel query to your actual data source names.
4. Save using the UID and title provided in the JSON.

## Ownership + URL source of truth

After import, copy the exact dashboard URL into:

- `docs/operations/TELEMETRY_DASHBOARD_REGISTRY.md`

Do not leave placeholder URLs once provisioned.
