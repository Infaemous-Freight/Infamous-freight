#!/usr/bin/env bash
set -euo pipefail

WEB_URL="${WEB_URL:-https://www.infamousfreight.com}"
BARE_SITE_URL="${BARE_SITE_URL:-https://infamousfreight.com}"
OUTPUT_DIR="${OUTPUT_DIR:-docs/evidence}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_FILE="${OUTPUT_FILE:-${OUTPUT_DIR}/netlify-launch-evidence-${TIMESTAMP}.md}"
PUBLIC_VALID_TRACKING_NUMBER="${PUBLIC_VALID_TRACKING_NUMBER:-}"
PUBLIC_VALID_SHIPMENT_URL="${PUBLIC_VALID_SHIPMENT_URL:-}"

mkdir -p "${OUTPUT_DIR}"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"' EXIT

canonical_headers="${tmp_dir}/canonical.headers"
apex_headers="${tmp_dir}/apex.headers"
api_health_body="${tmp_dir}/api-health.json"
quote_preflight_headers="${tmp_dir}/quote-preflight.headers"
invalid_tracking_body="${tmp_dir}/invalid-tracking.json"
valid_tracking_body="${tmp_dir}/valid-tracking.json"
valid_tracking_summary="${tmp_dir}/valid-tracking-summary.json"

canonical_status="$(
  curl --silent --show-error --location --head \
    --output "${canonical_headers}" \
    --write-out '%{http_code}' \
    "${WEB_URL}"
)"

apex_final_url="$(
  curl --silent --show-error --location --head \
    --output "${apex_headers}" \
    --write-out '%{url_effective}' \
    "${BARE_SITE_URL}"
)"

api_health_status="$(
  curl --silent --show-error --location \
    --output "${api_health_body}" \
    --write-out '%{http_code}' \
    "${WEB_URL%/}/api/health"
)"

api_health_content_type="$(
  curl --silent --show-error --location \
    --output /dev/null \
    --write-out '%{content_type}' \
    "${WEB_URL%/}/api/health"
)"

quote_preflight_status="$(
  curl --silent --show-error --location \
    --request OPTIONS \
    --output "${quote_preflight_headers}" \
    --write-out '%{http_code}' \
    "${WEB_URL%/}/api/public/quote-requests"
)"

invalid_tracking_status="$(
  curl --silent --show-error --location \
    --output "${invalid_tracking_body}" \
    --write-out '%{http_code}' \
    "${WEB_URL%/}/api/public/shipments/invalid-tracking"
)"

valid_tracking_status="skipped"
valid_tracking_target="not configured"
valid_tracking_failed=0
cat > "${valid_tracking_summary}" <<'EOF_SUMMARY'
{
  "skipped": true,
  "reason": "Set PUBLIC_VALID_TRACKING_NUMBER or PUBLIC_VALID_SHIPMENT_URL to validate a real production tracking record."
}
EOF_SUMMARY

if [[ -n "${PUBLIC_VALID_TRACKING_NUMBER}" || -n "${PUBLIC_VALID_SHIPMENT_URL}" ]]; then
  if [[ -n "${PUBLIC_VALID_TRACKING_NUMBER}" && ! "${PUBLIC_VALID_TRACKING_NUMBER}" =~ ^IF-[0-9]{5}$ ]]; then
    cat > "${valid_tracking_summary}" <<EOF_SUMMARY
{
  "success": false,
  "message": "PUBLIC_VALID_TRACKING_NUMBER must use the IF-##### format."
}
EOF_SUMMARY
    valid_tracking_status="invalid configuration"
    valid_tracking_target="configuration rejected"
    valid_tracking_failed=1
  fi

  if [[ "${valid_tracking_failed}" == "0" ]]; then
    if [[ -z "${PUBLIC_VALID_SHIPMENT_URL}" ]]; then
      PUBLIC_VALID_SHIPMENT_URL="${WEB_URL%/}/api/public/shipments/${PUBLIC_VALID_TRACKING_NUMBER}"
    fi

    valid_tracking_target="configured production tracking lookup"
    valid_tracking_status="$(
      curl --silent --show-error --location \
        --output "${valid_tracking_body}" \
        --write-out '%{http_code}' \
        "${PUBLIC_VALID_SHIPMENT_URL}"
    )"

    if [[ "${valid_tracking_status}" == "200" ]]; then
      if ! node - "${valid_tracking_body}" "${valid_tracking_summary}" "${PUBLIC_VALID_TRACKING_NUMBER}" <<'NODE'
const fs = require('node:fs');
const [inputFile, outputFile, expectedTrackingNumber] = process.argv.slice(2);

function fail(message) {
  fs.writeFileSync(outputFile, `${JSON.stringify({ success: false, message }, null, 2)}\n`);
  process.exitCode = 1;
}

try {
  const body = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const shipment = body.shipment;

  if (body.success !== true) {
    fail('Valid tracking response success flag must be true.');
  } else if (!shipment || typeof shipment !== 'object') {
    fail('Valid tracking response did not include shipment object.');
  } else {
    const missingField = ['trackingNumber', 'status', 'origin', 'destination', 'lastUpdated'].find((field) => (
      typeof shipment[field] !== 'string' || shipment[field].trim().length === 0
    ));

    if (missingField) {
      fail(`Valid tracking shipment.${missingField} is missing or empty.`);
    } else if (expectedTrackingNumber && shipment.trackingNumber !== expectedTrackingNumber) {
      fail('Valid tracking response trackingNumber did not match PUBLIC_VALID_TRACKING_NUMBER.');
    } else {
      const summary = {
        success: true,
        trackingNumberValidated: true,
        status: shipment.status,
        hasRoute: typeof shipment.route === 'string' && shipment.route.trim().length > 0,
        hasOrigin: true,
        hasDestination: true,
        hasTimeline: Array.isArray(shipment.timeline),
        timelineEvents: Array.isArray(shipment.timeline) ? shipment.timeline.length : 0,
        lastUpdated: shipment.lastUpdated,
      };

      fs.writeFileSync(outputFile, `${JSON.stringify(summary, null, 2)}\n`);
    }
  }
} catch (error) {
  fail(error instanceof Error ? error.message : 'Valid tracking response could not be parsed.');
}
NODE
      then
        valid_tracking_failed=1
      fi
    else
      cat > "${valid_tracking_summary}" <<EOF_SUMMARY
{
  "success": false,
  "status": "HTTP ${valid_tracking_status}",
  "message": "Configured valid tracking lookup did not return HTTP 200."
}
EOF_SUMMARY
      valid_tracking_failed=1
    fi
  fi
fi

header_value() {
  local header_file="$1"
  local header_name="$2"
  awk -v name="${header_name}:" 'BEGIN { IGNORECASE = 1 } $1 == name { sub(/^[^:]+:[[:space:]]*/, ""); value=$0 } END { print value }' "${header_file}" | tr -d '\r'
}

deploy_id="$(header_value "${canonical_headers}" "x-nf-request-id")"
cache_status="$(header_value "${canonical_headers}" "cache-status")"
content_security_policy="$(header_value "${canonical_headers}" "content-security-policy")"
strict_transport_security="$(header_value "${canonical_headers}" "strict-transport-security")"
x_frame_options="$(header_value "${canonical_headers}" "x-frame-options")"

cat > "${OUTPUT_FILE}" <<EOF
# Netlify Launch Evidence

Captured at: ${TIMESTAMP}

## Scope

This evidence captured the public customer path for Infamous Freight after a Netlify deploy. It checked the canonical web host, apex redirect behavior, proxied API health, quote intake preflight, invalid tracking validation, optional positive tracking validation, security headers, and the active Netlify request identifier. No production quote or shipment record was created by this check.

## Results

| Check | Result |
| --- | --- |
| Canonical host | HTTP ${canonical_status} for ${WEB_URL} |
| Apex redirect | ${BARE_SITE_URL} resolved to ${apex_final_url} |
| Proxied API health | HTTP ${api_health_status}, content type ${api_health_content_type:-unknown} |
| Public quote preflight | HTTP ${quote_preflight_status} |
| Invalid tracking lookup | HTTP ${invalid_tracking_status} |
| Positive tracking lookup | ${valid_tracking_status} for ${valid_tracking_target} |
| Netlify request identifier | ${deploy_id:-not returned} |
| Cache status | ${cache_status:-not returned} |

## Security Headers

| Header | Value |
| --- | --- |
| Strict-Transport-Security | ${strict_transport_security:-not returned} |
| Content-Security-Policy | ${content_security_policy:-not returned} |
| X-Frame-Options | ${x_frame_options:-not returned} |

## API Health Body

\`\`\`json
$(cat "${api_health_body}")
\`\`\`

## Invalid Tracking Body

\`\`\`json
$(cat "${invalid_tracking_body}")
\`\`\`

## Positive Tracking Summary

\`\`\`json
$(cat "${valid_tracking_summary}")
\`\`\`

## Expected Follow-Up

Operations should review public quote and contact leads in Netlify Forms first, then match API-backed quote records by tracking reference when a reference was returned. To complete positive public tracking validation, rerun this command with \`PUBLIC_VALID_TRACKING_NUMBER=IF-#####\` or \`PUBLIC_VALID_SHIPMENT_URL=...\` for a known-safe production shipment record. If the proxied API health result is not JSON, quote preflight does not return 204, or a configured positive tracking lookup does not return HTTP 200, the Netlify proxy, Fly API route, and production shipment record should be investigated before launch traffic is increased.
EOF

echo "Wrote ${OUTPUT_FILE}"

if [[ "${valid_tracking_failed}" != "0" ]]; then
  echo "ERROR: Positive public tracking validation failed. See ${OUTPUT_FILE}." >&2
  exit 1
fi
